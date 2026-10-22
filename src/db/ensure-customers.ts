import { pool } from "@/db";
import { describeDatabaseError, toDatabaseError } from "@/lib/db-error";

/**
 * Expected public.customers shape from src/db/schema.ts.
 * This table was added to the Drizzle schema after the original bootstrap
 * migration, so existing databases (including Neon) do not have it until this runs.
 */
export const CUSTOMERS_CREATE_SQL = `CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY,
  "name" text,
  "phone" text,
  "email" text,
  "orders" integer,
  "spend" numeric,
  "last_order_date" text,
  "marketing_consent" text,
  "source" text
)`;

const CUSTOMERS_ADD_COLUMN_SQL = [
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phone" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "orders" integer`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "spend" numeric`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_order_date" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "marketing_consent" text`,
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "source" text`,
];

export const EXPECTED_CUSTOMER_COLUMNS: Record<string, string> = {
  id: "integer",
  name: "text",
  phone: "text",
  email: "text",
  orders: "integer",
  spend: "numeric",
  last_order_date: "text",
  marketing_consent: "text",
  source: "text",
};

type ColumnRow = { column_name: string; data_type: string };

const globalForCustomers = globalThis as typeof globalThis & { __thaiCourtyardCustomersReady?: Promise<void> };

export function ensureCustomersTable(): Promise<void> {
  if (!globalForCustomers.__thaiCourtyardCustomersReady) {
    globalForCustomers.__thaiCourtyardCustomersReady = applyCustomersSchema().catch((error) => {
      globalForCustomers.__thaiCourtyardCustomersReady = undefined;
      throw error;
    });
  }
  return globalForCustomers.__thaiCourtyardCustomersReady;
}

async function applyCustomersSchema() {
  const before = await pool.query<{ customers: string | null }>("select to_regclass('public.customers') as customers");
  const existed = Boolean(before.rows[0]?.customers);
  try {
    await pool.query(CUSTOMERS_CREATE_SQL);
    for (const statement of CUSTOMERS_ADD_COLUMN_SQL) {
      await pool.query(statement);
    }
  } catch (error) {
    console.error("[db] customers schema repair failed\n" + describeDatabaseError(error));
    throw toDatabaseError(error);
  }
  const columns = await pool.query<ColumnRow>(
    `select column_name, data_type
     from information_schema.columns
     where table_schema = 'public' and table_name = 'customers'
     order by ordinal_position`,
  );
  const actual = Object.fromEntries(columns.rows.map((row) => [row.column_name, row.data_type]));
  const missing = Object.keys(EXPECTED_CUSTOMER_COLUMNS).filter((name) => !actual[name]);
  const typeMismatches = Object.entries(EXPECTED_CUSTOMER_COLUMNS).flatMap(([name, expected]) => {
    const found = actual[name];
    if (!found || found === expected) return [];
    return [`${name}: expected ${expected}, found ${found}`];
  });
  console.info("[db] customers table", {
    action: existed ? "already present" : "created",
    columns: actual,
    missing,
    typeMismatches,
  });
  if (missing.length || typeMismatches.length) {
    console.error("[db] customers schema does not match src/db/schema.ts", { missing, typeMismatches });
  }
}
