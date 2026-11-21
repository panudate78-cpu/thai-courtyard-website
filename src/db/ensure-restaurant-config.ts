import { pool } from "@/db";
import { SITE, OPENING_HOURS, DAY_NAMES } from "@/lib/site";

const globalForConfig = globalThis as typeof globalThis & { __restaurantConfigReady?: Promise<void> };

export function ensureRestaurantConfig(): Promise<void> {
  if (!globalForConfig.__restaurantConfigReady) {
    globalForConfig.__restaurantConfigReady = apply().catch((e) => {
      globalForConfig.__restaurantConfigReady = undefined;
      throw e;
    });
  }
  return globalForConfig.__restaurantConfigReady;
}

async function apply() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "restaurant_config" (
      "id" integer PRIMARY KEY DEFAULT 1,
      "setup_completed" boolean NOT NULL DEFAULT false,
      "restaurant_name" text NOT NULL DEFAULT 'Demo Restaurant',
      "full_name" text NOT NULL DEFAULT 'Demo Restaurant Sample Town',
      "tagline" text NOT NULL DEFAULT 'Fresh seasonal dining in Sample Town',
      "description" text NOT NULL DEFAULT 'Sample restaurant on High Street, Sample Town — warm, welcoming and family-friendly. Dine in, book a table or order takeaway online for collection. Pay on collection.',
      "short_description" text NOT NULL DEFAULT 'Family-friendly restaurant in Sample Town — dine in, takeaway collection & delivery. Fresh seasonal food cooked to order.',
      "address_street" text NOT NULL DEFAULT '123 High Street',
      "address_locality" text NOT NULL DEFAULT 'Sample Town',
      "address_region" text NOT NULL DEFAULT 'Surrey',
      "address_postcode" text NOT NULL DEFAULT 'KT9 1AB',
      "address_country" text NOT NULL DEFAULT 'GB',
      "geo_lat" numeric(10,7) NOT NULL DEFAULT '51.5074000',
      "geo_lng" numeric(10,7) NOT NULL DEFAULT '-0.1278000',
      "phone_display" text NOT NULL DEFAULT '020 1234 5678',
      "phone_href" text NOT NULL DEFAULT 'tel:+442012345678',
      "phone_intl" text NOT NULL DEFAULT '+44 20 1234 5678',
      "email" text NOT NULL DEFAULT 'info@example.com',
      "order_email" text,
      "deliveroo_url" text NOT NULL DEFAULT '',
      "google_place_id" text NOT NULL DEFAULT '',
      "google_review_url" text NOT NULL DEFAULT '',
      "google_maps_url" text NOT NULL DEFAULT '',
      "opening_hours" jsonb NOT NULL DEFAULT '{"0": null, "1": null, "2": {"open": "12:00", "close": "21:00"}, "3": {"open": "12:00", "close": "21:00"}, "4": {"open": "12:00", "close": "21:00"}, "5": {"open": "12:00", "close": "21:00"}, "6": {"open": "12:00", "close": "21:00"}}'::jsonb,
      "area_served" text[] NOT NULL DEFAULT '{ "Sample Town", "Riverside", "Hilltop", "Westfield", "Northwood", "Eastford", "Southgate", "Meadowbank", "Kingston", "Richmond"}'::text[],
      "price_range" text NOT NULL DEFAULT '££',
      "serves_cuisine" text[] NOT NULL DEFAULT '{"International","European"}'::text[],
      "currencies_accepted" text NOT NULL DEFAULT 'GBP',
      "payment_accepted" text NOT NULL DEFAULT 'Cash, Credit Card, Debit Card',
      "founding_location" text NOT NULL DEFAULT 'Sample Town, Surrey',
      "hours_summary" text NOT NULL DEFAULT 'Tuesday – Saturday, 12:00 – 21:00',
      "hours_short" text NOT NULL DEFAULT 'Tue – Sat · 12:00 – 21:00',
      "payment_notice" text NOT NULL DEFAULT 'Payment will be taken in restaurant when you collect your order. We accept cash and card.',
      "announcement" text,
      "theme_primary" text NOT NULL DEFAULT '#1a2a3a',
      "theme_accent" text NOT NULL DEFAULT '#c9a86a',
      "font_preset" text NOT NULL DEFAULT 'serif-sans',
      "logo_url" text NOT NULL DEFAULT '/images/logo.png',
      "hero_image_url" text NOT NULL DEFAULT '/images/hero-spread.jpg',
      "gallery_urls" text[] NOT NULL DEFAULT '{}'::text[],
      "og_image_url" text NOT NULL DEFAULT '/opengraph-image',
      "hero_title" text,
      "hero_intro" text,
      "about_title" text NOT NULL DEFAULT 'About Demo Restaurant',
      "about_intro" text NOT NULL DEFAULT 'A welcoming restaurant on High Street, Sample Town — seasonal dishes, warm hospitality and freshly prepared food, minutes from the town centre.',
      "about_story" text,
      "slot_interval_minutes" integer NOT NULL DEFAULT 15,
      "lead_time_minutes" integer NOT NULL DEFAULT 20,
      "max_days_ahead" integer NOT NULL DEFAULT 7,
      "closed_dates" text[] NOT NULL DEFAULT '{}'::text[],
      "payment_mode" text NOT NULL DEFAULT 'pay_on_collection',
      "site_url" text NOT NULL DEFAULT 'https://www.example.com',
      "email_from" text,
      "restaurant_email" text,
      "admin_password_hash" text,
      "created_at" timestamp with time zone NOT NULL DEFAULT now(),
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `);

  // Seed default Thai Courtyard row if empty (id=1) — keeps live prod intact
  await pool.query(`
    INSERT INTO "restaurant_config" ("id") VALUES (1)
    ON CONFLICT ("id") DO NOTHING;
  `);

  // If Thai Courtyard is live and has real data, ensure setup_completed is true so /setup stays locked
  // We keep it false by default for new clones; existing prod was seeded before wizard existed, so we flip it once.
  // Only runs if no admin hash yet and site looks like Thai Courtyard (no setupCompleted flag).
  // We do NOT overwrite a manually set true; we just ensure a fresh clone stays false.
  // For safety, we leave setup_completed as-is for Thai Courtyard production (operator can set via env or wizard).
  // No forced update here — admin will complete wizard to set true.

  try {
    const desiredUrl = (process.env.NEXT_PUBLIC_SITE_URL || SITE.url).replace(/\/$/, "");
    await pool.query(`UPDATE "restaurant_config" SET "site_url" = $1 WHERE "id"=1 AND "site_url" = 'https://www.example.com' AND $1 IS DISTINCT FROM "site_url"`, [desiredUrl]);
  } catch {}
}
