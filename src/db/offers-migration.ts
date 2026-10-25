import { pool } from "@/db";

export const OFFERS_CREATE_SQL = `CREATE TABLE IF NOT EXISTS "offers" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "cta_text" text NOT NULL,
  "cta_link" text NOT NULL,
  "image_data" text,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "display_order" integer NOT NULL DEFAULT 0,
  "enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "offers_date_range_check" CHECK ("ends_on" >= "starts_on")
)`;

export async function ensureOffersTable() {
  await pool.query(OFFERS_CREATE_SQL);
  await pool.query(`CREATE INDEX IF NOT EXISTS "offers_enabled_dates_order_idx" ON "offers" ("enabled", "starts_on", "ends_on", "display_order")`);
}
