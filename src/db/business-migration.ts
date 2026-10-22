import { pool } from "@/db";
import { CUSTOMERS_CREATE_SQL } from "./ensure-customers";

/**
 * Additive migration for the business dashboard.
 * Safe to run repeatedly. Failures are reported to the caller and must not
 * break ordering, bookings, or the public site.
 */
export const BUSINESS_MIGRATION_SQL = [
  CUSTOMERS_CREATE_SQL,
  `CREATE TABLE IF NOT EXISTS "business_settings" (
    "id" integer PRIMARY KEY,
    "opening_hours" jsonb NOT NULL,
    "holiday_hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "special_events" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "contact" jsonb NOT NULL,
    "notices" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "seo_overrides" (
    "id" serial PRIMARY KEY,
    "path" text NOT NULL,
    "meta_title" text,
    "meta_description" text,
    "og_title" text,
    "og_description" text,
    "og_image" text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "seo_overrides_path_unique" UNIQUE("path")
  )`,
] as const;

export async function ensureBusinessTables(): Promise<boolean> {
  try {
    for (const statement of BUSINESS_MIGRATION_SQL) {
      await pool.query(statement);
    }
    return true;
  } catch (error) {
    console.error("[business] could not create business tables", error);
    return false;
  }
}
