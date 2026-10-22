-- Repair for Orders and Customers admin pages.
--
-- Why this table was missing:
-- src/db/schema.ts defines public.customers, but src/db/migration-sql.ts
-- (the statements ensureDatabase() applies) never created it.
-- ensureDatabase() also skips that migration list when the original tables
-- already exist, which is the case on Neon. drizzle.config.json was pointed
-- at local Postgres, so drizzle-kit push did not update Neon either.
--
-- Run this against the same database as the application's DATABASE_URL.

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY,
  "name" text,
  "phone" text,
  "email" text,
  "orders" integer,
  "spend" numeric,
  "last_order_date" text,
  "marketing_consent" text,
  "source" text
);

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "orders" integer;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "spend" numeric;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "last_order_date" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "marketing_consent" text;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "source" text;
