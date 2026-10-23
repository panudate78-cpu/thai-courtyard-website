import { z } from "zod";
import type { SeedCategory } from "@/db/seed-data";
import { isDietaryKey } from "./dietary";
import { poundsToPence } from "./format";

/**
 * Menu import pipeline: file → draft → review in admin → publish.
 *
 * Supported sources:
 * - CSV / TSV (template: /menu-template.csv)
 * - Excel .xlsx / .xls (first sheet, same columns as the CSV template)
 * - PDF (best-effort text extraction: "Category" heading lines followed by
 *   "Dish name .... £9.50" lines — always reviewed before publishing)
 *
 * Nothing is written to the live menu until an admin approves the draft
 * on the review screen and clicks Publish.
 */

export type ImportItem = {
  name: string;
  description: string;
  pricePence: number;
  dietary: string[];
  featured: boolean;
  available: boolean;
};

export type ImportCategory = { name: string; description: string; items: ImportItem[] };

export type ImportDraft = {
  categories: ImportCategory[];
  warnings: string[];
  sourceType: "csv" | "xlsx" | "pdf";
  filename: string;
};

export const importPublishSchema = z.object({
  filename: z.string().trim().max(160),
  sourceType: z.enum(["csv", "xlsx", "pdf"]),
  mode: z.enum(["replace", "append"]),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        description: z.string().trim().max(300),
        items: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(120),
              description: z.string().trim().max(600),
              pricePence: z.number().int().min(0).max(1_000_000),
              dietary: z.array(z.string()).max(10),
              featured: z.boolean(),
              available: z.boolean(),
            }),
          )
          .max(300),
      }),
    )
    .min(1)
    .max(60),
});

export type ImportPublishInput = z.infer<typeof importPublishSchema>;

export function draftToSeed(draft: ImportPublishInput): SeedCategory[] {
  return draft.categories
    .map((c) => ({
      name: c.name,
      description: c.description || undefined,
      items: c.items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name,
          description: i.description || undefined,
          price: i.pricePence,
          dietary: i.dietary.filter(isDietaryKey),
          featured: i.featured,
        })),
    }))
    .filter((c) => c.items.length > 0);
}

/* ------------------------------- CSV / TSV ------------------------------ */

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = false;
      } else current += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      cells.push(current);
      current = "";
    } else current += ch;
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

const HEADER_ALIASES: Record<string, string> = {
  category: "category",
  section: "category",
  name: "name",
  item: "name",
  dish: "name",
  "item name": "name",
  description: "description",
  desc: "description",
  details: "description",
  price: "price",
  "price (£)": "price",
  "price (gbp)": "price",
  cost: "price",
  dietary: "dietary",
  tags: "dietary",
  allergens: "dietary",
  featured: "featured",
  "chef's pick": "featured",
  available: "available",
  visible: "available",
};

export function parseDelimited(text: string, filename: string): ImportDraft {
  const warnings: string[] = [];
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!lines.length) return { categories: [], warnings: ["The file is empty."], sourceType: "csv", filename };
  const delimiter = (lines[0].match(/\t/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? "\t" : lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const headerRaw = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const header = headerRaw.map((h) => HEADER_ALIASES[h] ?? h);
  const hasHeader = header.includes("name") && header.includes("price");
  const columns = hasHeader ? header : ["category", "name", "description", "price", "dietary"];
  if (!hasHeader) warnings.push("No header row recognised — assumed column order: Category, Name, Description, Price, Dietary.");

  const byCategory = new Map<string, ImportCategory>();
  const rows = hasHeader ? lines.slice(1) : lines;
  rows.forEach((line, index) => {
    const cells = splitCsvLine(line, delimiter);
    const get = (key: string) => {
      const idx = columns.indexOf(key);
      return idx >= 0 ? (cells[idx] ?? "") : "";
    };
    const name = get("name");
    if (!name) {
      warnings.push(`Row ${index + 2}: skipped (no item name).`);
      return;
    }
    const pricePence = poundsToPence(get("price"));
    if (!Number.isFinite(pricePence) || pricePence < 0) {
      warnings.push(`Row ${index + 2} ("${name}"): could not read the price — set to £0.00, please fix before publishing.`);
    }
    const categoryName = get("category") || "Menu";
    if (!byCategory.has(categoryName)) byCategory.set(categoryName, { name: categoryName, description: "", items: [] });
    const dietary = get("dietary")
      .split(/[|;]/)
      .map((d) => d.trim().toLowerCase().replace(/\s+/g, "_"))
      .filter((d) => d && isDietaryKey(d));
    byCategory.get(categoryName)?.items.push({
      name,
      description: get("description"),
      pricePence: Number.isFinite(pricePence) ? pricePence : 0,
      dietary,
      featured: /^(y|yes|true|1)$/i.test(get("featured")),
      available: !/^(n|no|false|0)$/i.test(get("available") || "yes"),
    });
  });
  return { categories: [...byCategory.values()], warnings, sourceType: "csv", filename };
}

/* --------------------------------- Excel -------------------------------- */

export async function parseSpreadsheet(buffer: ArrayBuffer, filename: string): Promise<ImportDraft> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { categories: [], warnings: ["The workbook has no sheets."], sourceType: "xlsx", filename };
  const sheet = workbook.Sheets[sheetName];
  const csv = XLSX.utils.sheet_to_csv(sheet);
  const draft = parseDelimited(csv, filename);
  return { ...draft, sourceType: "xlsx", warnings: [`Read sheet "${sheetName}".`, ...draft.warnings] };
}

/* ---------------------------------- PDF --------------------------------- */

const PRICE_RE = /£?\s?(\d{1,3}(?:\.\d{2})?)\s*$/;

export function parseMenuText(text: string, filename: string): ImportDraft {
  const warnings = [
    "PDF menus are converted on a best-effort basis. Check every name, description and price on the review screen before publishing.",
  ];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const categories: ImportCategory[] = [];
  let current: ImportCategory | null = null;
  let pendingDescription = "";

  for (const line of lines) {
    const priceMatch = line.match(PRICE_RE);
    const withoutPrice = priceMatch ? line.slice(0, priceMatch.index).replace(/[.\-–—\s]+$/, "").trim() : line;
    const isHeading =
      !priceMatch &&
      line.length <= 40 &&
      (line === line.toUpperCase() || /^(starters|mains|main courses|desserts|drinks|sides|grill|specials|salads|soups|curries|noodles|rice|burgers|pizza|pasta|small plates|sharing|breakfast|lunch|dinner|kids|children)/i.test(line));
    if (isHeading) {
      current = { name: toTitleCase(line), description: "", items: [] };
      categories.push(current);
      pendingDescription = "";
      continue;
    }
    if (priceMatch && withoutPrice.length >= 2) {
      if (!current) {
        current = { name: "Menu", description: "", items: [] };
        categories.push(current);
      }
      current.items.push({
        name: withoutPrice,
        description: pendingDescription,
        pricePence: poundsToPence(priceMatch[1]),
        dietary: [],
        featured: false,
        available: true,
      });
      pendingDescription = "";
    } else if (current && current.items.length && line.length > 12) {
      // Likely a description for the previous or next dish.
      const last = current.items[current.items.length - 1];
      if (last && !last.description) last.description = line;
      else pendingDescription = line;
    }
  }
  const nonEmpty = categories.filter((c) => c.items.length);
  if (!nonEmpty.length) warnings.push("No dishes with prices could be found in this PDF. Try the CSV template instead.");
  return { categories: nonEmpty, warnings, sourceType: "pdf", filename };
}

function toTitleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function parsePdf(buffer: ArrayBuffer, filename: string): Promise<ImportDraft> {
  const { extractText } = await import("unpdf");
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return parseMenuText(Array.isArray(text) ? text.join("\n") : text, filename);
}

/* --------------------------------- Router -------------------------------- */

export async function parseMenuFile(file: File): Promise<ImportDraft> {
  const buffer = await file.arrayBuffer();
  const name = file.name || "menu";
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf") || file.type === "application/pdf") return parsePdf(buffer, name);
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return parseSpreadsheet(buffer, name);
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
    return parseDelimited(new TextDecoder().decode(buffer), name);
  }
  throw new Error("Unsupported file type. Upload a .csv, .tsv, .xlsx, .xls or .pdf file.");
}

export const MENU_CSV_TEMPLATE = `Category,Name,Description,Price,Dietary,Featured
Starters,Soup of the Day,Chef's daily soup with warm bread,6.50,vegetarian,
Starters,Crispy Halloumi,Golden fried halloumi with chilli jam,7.50,vegetarian|popular,yes
Mains,Grilled Chicken,Chargrilled chicken with seasonal vegetables,16.50,gluten_free,yes
Mains,Garden Risotto,Creamy risotto with garden vegetables,14.50,vegetarian|gluten_free,
Desserts,Sticky Toffee Pudding,With toffee sauce and vanilla ice cream,7.50,vegetarian,yes
Drinks,Still Water 500ml,,2.00,,
`;
