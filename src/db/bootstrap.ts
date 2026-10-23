import { count, eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { ensureBusinessTables } from "./business-migration";
import { ensureCustomersTable } from "./ensure-customers";
import { MIGRATION_STATEMENTS } from "./migration-sql";
import { menuCategories, menuItems, optionChoices, optionGroups, restaurantProfile, siteSettings } from "./schema";
import { DEMO_MENU, type SeedCategory, type SeedGroup } from "./seed-data";

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

const globalForBootstrap = globalThis as typeof globalThis & { __rmpDbReady?: Promise<void> };

/**
 * Makes sure the schema exists on a brand-new (e.g. empty Neon) database.
 * Runs once per server process. `npx drizzle-kit push` produces the same
 * schema; this is a safety net so a fresh deployment works with zero
 * manual SQL. No client data is seeded here beyond the demo profile/menu,
 * which the Setup Wizard replaces.
 */
export function ensureDatabase(): Promise<void> {
  if (!globalForBootstrap.__rmpDbReady) {
    globalForBootstrap.__rmpDbReady = bootstrap().catch((error) => {
      globalForBootstrap.__rmpDbReady = undefined;
      throw error;
    });
  }
  return globalForBootstrap.__rmpDbReady;
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
  await ensureCustomersTable();
  await ensureBusinessTables();
  await ensureProfileRow();
  await seedDemoMenuIfNeeded();
}

async function ensureProfileRow() {
  await db.insert(restaurantProfile).values({ id: 1 }).onConflictDoNothing();
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

/** Inserts a full menu (categories, items, option groups) in one transaction. */
export async function insertMenu(tx: Tx, menu: SeedCategory[], sortOffset = 0) {
  for (const [catIndex, category] of menu.entries()) {
    const [cat] = await tx
      .insert(menuCategories)
      .values({ name: category.name, description: category.description ?? null, sortOrder: sortOffset + catIndex })
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
}

/**
 * Seeds the neutral demo menu only while the platform is still in demo /
 * pre-setup mode and the menu is empty. Once setup is completed with
 * "start empty" or an imported menu, this never re-seeds.
 */
async function seedDemoMenuIfNeeded() {
  const [{ value }] = await db.select({ value: count() }).from(menuCategories);
  if (value > 0) return;
  const [profile] = await db
    .select({ setupCompleted: restaurantProfile.setupCompleted, demoMode: restaurantProfile.demoMode })
    .from(restaurantProfile)
    .where(eq(restaurantProfile.id, 1))
    .limit(1);
  if (profile?.setupCompleted && !profile.demoMode) return;
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7240012026)`);
    const [{ value: existing }] = await tx.select({ value: count() }).from(menuCategories);
    if (existing > 0) return;
    await insertMenu(tx, DEMO_MENU);
  });
}

/** Replaces the entire menu — used by Reset Demo Data and menu import ("replace" mode). */
export async function replaceMenu(menu: SeedCategory[]) {
  await ensureDatabase();
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7240012026)`);
    await tx.delete(menuCategories); // cascades to items / groups / choices
    await insertMenu(tx, menu);
  });
}

/** Appends categories to the existing menu — used by menu import ("append" mode). */
export async function appendMenu(menu: SeedCategory[]) {
  await ensureDatabase();
  const [{ value: existing }] = await db.select({ value: count() }).from(menuCategories);
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(7240012026)`);
    await insertMenu(tx, menu, existing);
  });
}

/** Removes every menu category/item — used by the Setup Wizard's "start empty" choice. */
export async function clearMenu() {
  await ensureDatabase();
  await db.delete(menuCategories);
}
