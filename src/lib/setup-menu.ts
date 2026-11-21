import { pool } from "@/db";
import { db } from "@/db";
import { menuCategories, menuItems, optionGroups, optionChoices } from "@/db/schema";
import { sql } from "drizzle-orm";

/**
 * Very small CSV/JSON menu processor for the /setup wizard.
 * - Accepts JSON like { categories: [{name, description, groups, items:[{name,price,description,dietary, groups}]}]}
 * - Or CSV with header: category,name,description,price,dietary,groups
 * - Auto-fills definite allergens via the DEFINITE_ALLERGENS map in ensure-allergens (re-used)
 * - Replaces the entire menu in a transaction (Thai Courtyard seed is preserved if payload empty)
 */

type ParsedItem = {
  name: string;
  description?: string;
  price: number; // pence or pounds? we normalise
  dietary?: string[];
  allergens?: string[];
  groups?: Array<{ name: string; required: boolean; maxSelect: number; choices: Array<[string, number]> }>;
};

type ParsedCategory = {
  name: string;
  description?: string;
  groups?: ParsedItem["groups"];
  items: ParsedItem[];
};

function penceFromPrice(price: string | number): number {
  const n = typeof price === "number" ? price : Number(String(price).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  // If price < 100 and has decimal, treat as pounds e.g. "12.50" -> 1250p; if already pence like 1250, keep
  // Heuristic: if price string contains "." and n < 1000, treat as pounds
  const raw = String(price);
  if (raw.includes(".") && n < 1000) return Math.round(n * 100);
  if (Number.isInteger(n) && n < 1000 && !raw.includes(".")) return Math.round(n * 100); // e.g. "12" -> 1200
  return Math.round(n);
}

function allergensForDish(name: string): string[] {
  // Mirrors DEFINITE_ALLERGENS in ensure-allergens.ts — keep small here for wizard preview
  const map: Record<string, string[]> = {
    "Thai Prawn Crackers": ["crustaceans", "gluten"],
    "Vegetable Spring Rolls": ["gluten", "soya"],
    "Satay Chicken": ["peanuts", "soya", "gluten"],
    "Prawn Sesame Rolls": ["crustaceans", "sesame", "gluten", "soya"],
    "Salt & Pepper Tofu": ["soya", "gluten"],
    "Pad Thai": ["peanuts", "soya", "gluten", "fish", "egg", "crustaceans"],
  };
  return map[name] || [];
}

function parseCsv(csv: string): ParsedCategory[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV needs header + at least one row");
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = {
    category: header.indexOf("category"),
    name: header.indexOf("name"),
    description: header.indexOf("description"),
    price: header.indexOf("price"),
    dietary: header.indexOf("dietary"),
    allergens: header.indexOf("allergens"),
  };
  if (idx.category === -1 || idx.name === -1 || idx.price === -1) throw new Error('CSV header must include at least "category,name,price"');
  const byCat = new Map<string, ParsedCategory>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    // Naive CSV split — assumes no quoted commas; sample template avoids commas in fields or uses quoted
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const cat = cols[idx.category] || "General";
    const name = cols[idx.name];
    if (!name) continue;
    const price = penceFromPrice(cols[idx.price] || "0");
    const description = idx.description !== -1 ? cols[idx.description] : undefined;
    const dietary = idx.dietary !== -1 && cols[idx.dietary] ? cols[idx.dietary].split(";").map((s) => s.trim()).filter(Boolean) : [];
    const allergens = idx.allergens !== -1 && cols[idx.allergens] ? cols[idx.allergens].split(";").map((s) => s.trim()).filter(Boolean) : allergensForDish(name);
    if (!byCat.has(cat)) byCat.set(cat, { name: cat, items: [] });
    byCat.get(cat)!.items.push({ name, description, price, dietary, allergens });
  }
  return [...byCat.values()];
}

function parseJson(payload: string): ParsedCategory[] {
  const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) return parsed as ParsedCategory[];
  if (parsed.categories && Array.isArray(parsed.categories)) return parsed.categories as ParsedCategory[];
  if (parsed.items && Array.isArray(parsed.items)) return [{ name: "Menu", items: parsed.items as ParsedItem[] }];
  throw new Error("JSON must be { categories: [...] } or [...] or { items: [...] }");
}

export async function processMenuPayload(raw: string): Promise<{ categories: number; items: number }> {
  let categories: ParsedCategory[];
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      categories = parseJson(trimmed);
    } catch {
      // Fall back to CSV attempt if JSON fails but contains commas
      categories = parseCsv(trimmed);
    }
  } else {
    categories = parseCsv(trimmed);
  }

  if (!categories.length) throw new Error("No categories found");

  // Auto-fill allergens where missing, using allergensForDish or empty
  for (const c of categories) {
    for (const item of c.items) {
      if (!item.allergens || !item.allergens.length) {
        const auto = allergensForDish(item.name);
        if (auto.length) item.allergens = auto;
      }
      // Normalise price already
      if (typeof item.price === "string") item.price = penceFromPrice(item.price as unknown as string);
    }
  }

  // Replace menu in DB transaction — clear existing, insert new
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7240012026)`);
    // Delete in FK order
    await tx.execute(sql`DELETE FROM option_choices`);
    await tx.execute(sql`DELETE FROM option_groups`);
    await tx.execute(sql`DELETE FROM menu_items`);
    await tx.execute(sql`DELETE FROM menu_categories`);

    for (const [catIdx, cat] of categories.entries()) {
      const [catRow] = await tx
        .insert(menuCategories)
        .values({ name: cat.name, description: cat.description || null, sortOrder: catIdx })
        .returning({ id: menuCategories.id });
      // Category groups
      if (cat.groups) {
        for (const [gIdx, g] of cat.groups.entries()) {
          const [grp] = await tx
            .insert(optionGroups)
            .values({ name: g.name, required: g.required ?? true, maxSelect: g.maxSelect ?? 1, sortOrder: gIdx, categoryId: catRow.id })
            .returning({ id: optionGroups.id });
          await tx.insert(optionChoices).values(g.choices.map(([nm, p], i) => ({ groupId: grp.id, name: nm, pricePence: typeof p === "number" ? p : penceFromPrice(p as unknown as string), sortOrder: i })));
        }
      }
      for (const [itemIdx, item] of cat.items.entries()) {
        const [itRow] = await tx
          .insert(menuItems)
          .values({
            categoryId: catRow.id,
            name: item.name,
            description: item.description || null,
            pricePence: item.price,
            dietary: item.dietary || [],
            allergens: item.allergens || [],
            sortOrder: itemIdx,
          })
          .returning({ id: menuItems.id });
        if (item.groups) {
          for (const [gIdx, g] of item.groups.entries()) {
            const [grp] = await tx
              .insert(optionGroups)
              .values({ name: g.name, required: g.required ?? true, maxSelect: g.maxSelect ?? 1, sortOrder: gIdx, itemId: itRow.id })
              .returning({ id: optionGroups.id });
            await tx.insert(optionChoices).values(g.choices.map(([nm, p], i) => ({ groupId: grp.id, name: nm, pricePence: typeof p === "number" ? p : penceFromPrice(p as unknown as string), sortOrder: i })));
          }
        }
      }
    }
  });

  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  return { categories: categories.length, items: totalItems };
}
