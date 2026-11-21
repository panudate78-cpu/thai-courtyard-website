import { pool } from "@/db";

const globalForPayment = globalThis as typeof globalThis & { __paymentMigrationDone?: Promise<void> };

export function ensurePaymentColumns(): Promise<void> {
  if (!globalForPayment.__paymentMigrationDone) {
    globalForPayment.__paymentMigrationDone = apply().catch((e) => {
      globalForPayment.__paymentMigrationDone = undefined;
      throw e;
    });
  }
  return globalForPayment.__paymentMigrationDone;
}

async function apply() {
  // restaurant_config.payment_mode
  await pool.query(`
    ALTER TABLE "restaurant_config" ADD COLUMN IF NOT EXISTS "payment_mode" text NOT NULL DEFAULT 'pay_on_collection';
  `).catch((e) => console.warn("[db] payment_mode column", e));

  // Backfill existing rows that might have been created before default
  await pool.query(`
    UPDATE "restaurant_config" SET "payment_mode" = 'pay_on_collection' WHERE "payment_mode" IS NULL OR "payment_mode" NOT IN ('pay_on_collection','stripe_online','customer_choice');
  `).catch(() => {});

  // orders payment columns
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text NOT NULL DEFAULT 'pay_on_collection';`).catch(() => {});
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'unpaid';`).catch(() => {});
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "stripe_session_id" text;`).catch(() => {});
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;`).catch(() => {});

  // Fix old orders that were instantly confirmed: they were effectively paid on collection, mark as paid so admin doesn't show unpaid
  // Only where payment_method is default and payment_status still unpaid but status is not new? We leave them as unpaid initially and admin shows Pay on collection anyway.
  // For correct semantics: pay_on_collection orders are considered paid on collection, not online — but for kitchen flow we consider them paid (no Stripe needed).
  // So we update legacy pay_on_collection rows to payment_status='paid' where status != 'cancelled'.
  await pool.query(`
    UPDATE "orders" SET "payment_status" = 'paid' WHERE "payment_method" = 'pay_on_collection' AND "payment_status" = 'unpaid' AND "status" != 'cancelled';
  `).catch(() => {});

  // Indexes for webhook lookup
  await pool.query(`CREATE INDEX IF NOT EXISTS "orders_stripe_session_idx" ON "orders" ("stripe_session_id");`).catch(() => {});
}
