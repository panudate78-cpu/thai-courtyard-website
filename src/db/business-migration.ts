import { pool } from "@/db";
import { CUSTOMERS_CREATE_SQL } from "./ensure-customers";

/**
 * Additive migration for the platform/business tables.
 * Safe to run repeatedly on a brand-new empty Neon database or an existing
 * one. Failures are reported to the caller and must not break ordering,
 * bookings, or the public site.
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
  `CREATE TABLE IF NOT EXISTS "restaurant_profile" (
    "id" integer PRIMARY KEY,
    "name" text DEFAULT 'Demo Restaurant' NOT NULL,
    "tagline" text,
    "description" text,
    "cuisine" text,
    "hero_headline" text,
    "hero_subheadline" text,
    "about_text" text,
    "email" text,
    "phone_display" text DEFAULT '020 7946 0958' NOT NULL,
    "street" text DEFAULT '1 High Street' NOT NULL,
    "locality" text DEFAULT 'Your Town' NOT NULL,
    "region" text,
    "postcode" text DEFAULT 'AB1 2CD' NOT NULL,
    "country" text DEFAULT 'GB' NOT NULL,
    "geo_lat" double precision,
    "geo_lng" double precision,
    "google_place_id" text,
    "google_review_url" text,
    "logo_url" text,
    "hero_image_url" text,
    "about_image_url" text,
    "gallery_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "primary_color" text DEFAULT '#c9a14a' NOT NULL,
    "secondary_color" text DEFAULT '#6b4226' NOT NULL,
    "facebook_url" text,
    "instagram_url" text,
    "tripadvisor_url" text,
    "delivery_enabled" boolean DEFAULT false NOT NULL,
    "delivery_url" text,
    "delivery_label" text,
    "delivery_fee_pence" integer DEFAULT 0 NOT NULL,
    "delivery_min_order_pence" integer DEFAULT 0 NOT NULL,
    "delivery_notes" text,
    "collection_enabled" boolean DEFAULT true NOT NULL,
    "collection_instructions" text,
    "pay_on_collection" boolean DEFAULT true NOT NULL,
    "pay_online_enabled" boolean DEFAULT false NOT NULL,
    "stripe_publishable_key" text,
    "stripe_test_mode" boolean DEFAULT true NOT NULL,
    "currency" text DEFAULT 'GBP' NOT NULL,
    "timezone" text DEFAULT 'Europe/London' NOT NULL,
    "locale" text DEFAULT 'en-GB' NOT NULL,
    "setup_completed" boolean DEFAULT false NOT NULL,
    "demo_mode" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "menu_imports" (
    "id" serial PRIMARY KEY,
    "filename" text NOT NULL,
    "source_type" text DEFAULT 'csv' NOT NULL,
    "status" text DEFAULT 'published' NOT NULL,
    "category_count" integer DEFAULT 0 NOT NULL,
    "item_count" integer DEFAULT 0 NOT NULL,
    "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  )`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" text DEFAULT 'pay_on_collection' NOT NULL`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'unpaid' NOT NULL`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "is_demo" boolean DEFAULT false NOT NULL`,
  `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "is_demo" boolean DEFAULT false NOT NULL`,
] as const;

const globalForBusiness = globalThis as typeof globalThis & { __rmpBusinessReady?: Promise<boolean> };

export function ensureBusinessTables(): Promise<boolean> {
  if (!globalForBusiness.__rmpBusinessReady) {
    globalForBusiness.__rmpBusinessReady = (async () => {
      try {
        for (const statement of BUSINESS_MIGRATION_SQL) {
          await pool.query(statement);
        }
        return true;
      } catch (error) {
        console.error("[business] could not create business tables", error);
        globalForBusiness.__rmpBusinessReady = undefined;
        return false;
      }
    })();
  }
  return globalForBusiness.__rmpBusinessReady;
}
