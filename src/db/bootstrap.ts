import { count, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { ensureBusinessTables } from "./business-migration";
import { ensureCustomersTable } from "./ensure-customers";
import { ensureVisitsTable } from "./visits-migration";
import { ensureAllergensColumn } from "./ensure-allergens";
import { ensureOffersTable } from "./offers-migration";
import { MIGRATION_STATEMENTS } from "./migration-sql";
import { menuCategories, menuItems, optionChoices, optionGroups, siteSettings } from "./schema";
import { SEED_MENU, type SeedGroup } from "./seed-data";

const TABLES = [
  "menu_categories",
  "menu_items",
  "option_groups",
  "option_choices",
  "orders",
  "order_items",
  "bookings",
  "contact_messages",
  "site_settings",
];

// "already exists" style errors are safe to ignore when re-applying the schema.
const IGNORABLE_CODES = new Set(["42P07", "42710", "42701", "42P06", "42P16", "23505"]);

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const globalForBootstrap = globalThis as typeof globalThis & { __thaiCourtyardDbReady?: Promise<void> };

/**
 * Makes sure the schema exists and the menu is seeded. Runs once per server process.
 * (`npx drizzle-kit push` produces the same schema; this is a safety net for fresh databases.)
 */
export function ensureDatabase(): Promise<void> {
  if (!globalForBootstrap.__thaiCourtyardDbReady) {
    globalForBootstrap.__thaiCourtyardDbReady = bootstrap().catch((error) => {
      globalForBootstrap.__thaiCourtyardDbReady = undefined;
      throw error;
    });
  }
  return globalForBootstrap.__thaiCourtyardDbReady;
}

async function bootstrap() {
  const { rows } = await pool.query<{ name: string | null }>(
    "select to_regclass('public.' || t)::text as name from unnest($1::text[]) as t",
    [TABLES],
  );
  if (rows.some((r) => !r.name)) {
    for (const statement of MIGRATION_STATEMENTS) {
      try {
        await pool.query(statement);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (!code || !IGNORABLE_CODES.has(code)) throw error;
      }
    }
  }
  await db.insert(siteSettings).values({ id: 1 }).onConflictDoNothing();
  await seedMenuIfEmpty();
  await ensureCustomersTable();
  try { await ensureAllergensColumn(); } catch {}
  await ensureBusinessTables();
  await ensureVisitsTable();
  await ensureOffersTable();
}

async function insertGroups(tx: Tx, groups: SeedGroup[], owner: { categoryId?: number; itemId?: number }) {
  for (const [index, group] of groups.entries()) {
    const [row] = await tx
      .insert(optionGroups)
      .values({
        name: group.name,
        required: group.required,
        maxSelect: group.maxSelect,
        sortOrder: index,
        categoryId: owner.categoryId ?? null,
        itemId: owner.itemId ?? null,
      })
      .returning({ id: optionGroups.id });
    await tx
      .insert(optionChoices)
      .values(group.choices.map(([name, pricePence], i) => ({ groupId: row.id, name, pricePence, sortOrder: i })));
  }
}

async function seedMenuIfEmpty() {
  const [{ value }] = await db.select({ value: count() }).from(menuCategories);
  if (value > 0) return;
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7240012026)`);
    const [{ value: existing }] = await tx.select({ value: count() }).from(menuCategories);
    if (existing > 0) return;
    for (const [catIndex, category] of SEED_MENU.entries()) {
      const [cat] = await tx
        .insert(menuCategories)
        .values({ name: category.name, description: category.description ?? null, sortOrder: catIndex })
        .returning({ id: menuCategories.id });
      if (category.groups) await insertGroups(tx, category.groups, { categoryId: cat.id });
      for (const [itemIndex, item] of category.items.entries()) {
        const [row] = await tx
          .insert(menuItems)
          .values({
            categoryId: cat.id,
            name: item.name,
            description: item.description ?? null,
            pricePence: item.price,
            dietary: item.dietary ?? [],
            featured: item.featured ?? false,
            sortOrder: itemIndex,
          })
          .returning({ id: menuItems.id });
        if (item.groups) await insertGroups(tx, item.groups, { itemId: row.id });
      }
    }
  });
}
