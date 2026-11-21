import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * White-label restaurant configuration — single row (id=1).
 * Holds everything that was previously hardcoded in src/lib/site.ts, seo.ts, hours, colours, etc.
 * Production Thai Courtyard is seeded as the default so existing live site never breaks;
 * new clients fill it via /setup wizard (guarded by setup_completed).
 */
export const restaurantConfig = pgTable("restaurant_config", {
  id: integer("id").primaryKey().default(1),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  // Identity
  restaurantName: text("restaurant_name").notNull().default("Demo Restaurant"),
  fullName: text("full_name").notNull().default("Demo Restaurant Sample Town"),
  tagline: text("tagline").notNull().default("Fresh seasonal dining in Sample Town"),
  description: text("description")
    .notNull()
    .default(
      "Sample restaurant on High Street, Sample Town — warm, welcoming and family-friendly. Dine in, book a table or order takeaway online for collection. Pay on collection.",
    ),
  shortDescription: text("short_description")
    .notNull()
    .default(
      "Family-friendly restaurant in Sample Town — dine in, takeaway collection & delivery. Fresh seasonal food cooked to order.",
    ),
  // Contact & location
  addressStreet: text("address_street").notNull().default("123 High Street"),
  addressLocality: text("address_locality").notNull().default("Sample Town"),
  addressRegion: text("address_region").notNull().default("Surrey"),
  addressPostcode: text("address_postcode").notNull().default("KT9 1AB"),
  addressCountry: text("address_country").notNull().default("GB"),
  geoLat: numeric("geo_lat", { precision: 10, scale: 7 }).notNull().default("51.5074000"),
  geoLng: numeric("geo_lng", { precision: 10, scale: 7 }).notNull().default("-0.1278000"),
  phoneDisplay: text("phone_display").notNull().default("020 1234 5678"),
  phoneHref: text("phone_href").notNull().default("tel:+442012345678"),
  phoneIntl: text("phone_intl").notNull().default("+44 20 1234 5678"),
  email: text("email").notNull().default("info@example.com"),
  orderEmail: text("order_email"),
  // Links
  deliverooUrl: text("deliveroo_url").notNull().default(""),
  googlePlaceId: text("google_place_id").notNull().default(""),
  googleReviewUrl: text("google_review_url").notNull().default(""),
  googleMapsUrl: text("google_maps_url").notNull().default(""),
  // Business
  openingHours: jsonb("opening_hours")
    .$type<Record<string, { open: string; close: string } | null>>()
    .notNull()
    .default(
      sql`'{"0": null, "1": null, "2": {"open": "12:00", "close": "21:00"}, "3": {"open": "12:00", "close": "21:00"}, "4": {"open": "12:00", "close": "21:00"}, "5": {"open": "12:00", "close": "21:00"}, "6": {"open": "12:00", "close": "21:00"}}'::jsonb`,
    ),
  areaServed: text("area_served")
    .array()
    .notNull()
    .default(
      sql`'{ "Sample Town", "Riverside", "Hilltop", "Westfield", "Northwood", "Eastford", "Southgate", "Meadowbank", "Kingston", "Richmond"}'::text[]`,
    ),
  priceRange: text("price_range").notNull().default("££"),
  servesCuisine: text("serves_cuisine").array().notNull().default(sql`'{"International","European"}'::text[]`),
  currenciesAccepted: text("currencies_accepted").notNull().default("GBP"),
  paymentAccepted: text("payment_accepted").notNull().default("Cash, Credit Card, Debit Card"),
  foundingLocation: text("founding_location").notNull().default("Sample Town, Surrey"),
  hoursSummary: text("hours_summary").notNull().default("Tuesday – Saturday, 12:00 – 21:00"),
  hoursShort: text("hours_short").notNull().default("Tue – Sat · 12:00 – 21:00"),
  paymentNotice: text("payment_notice").notNull().default("Payment will be taken in restaurant when you collect your order. We accept cash and card."),
  announcement: text("announcement"),
  // Branding / theme
  themePrimary: text("theme_primary").notNull().default("#1a2a3a"),
  themeAccent: text("theme_accent").notNull().default("#c9a86a"),
  fontPreset: text("font_preset").notNull().default("serif-sans"),
  logoUrl: text("logo_url").notNull().default("/images/logo.png"),
  heroImageUrl: text("hero_image_url").notNull().default("/images/hero-spread.jpg"),
  galleryUrls: text("gallery_urls").array().notNull().default(sql`'{}'::text[]`),
  ogImageUrl: text("og_image_url").notNull().default("/opengraph-image"),
  // Copy
  heroTitle: text("hero_title"),
  heroIntro: text("hero_intro"),
  aboutTitle: text("about_title").notNull().default("About Demo Restaurant"),
  aboutIntro: text("about_intro").notNull().default("A welcoming restaurant on High Street, Sample Town — seasonal dishes, warm hospitality and freshly prepared food, minutes from the town centre."),
  aboutStory: text("about_story"),
  // Slot rules (also duplicated in site_settings for backwards compat — kept in sync)
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(15),
  leadTimeMinutes: integer("lead_time_minutes").notNull().default(20),
  maxDaysAhead: integer("max_days_ahead").notNull().default(7),
  closedDates: text("closed_dates").array().notNull().default(sql`'{}'::text[]`),
  // Payments
  paymentMode: text("payment_mode").notNull().default("pay_on_collection"),
  // Site / email
  siteUrl: text("site_url").notNull().default("https://www.example.com"),
  emailFrom: text("email_from"),
  restaurantEmail: text("restaurant_email"),
  // Auth
  adminPasswordHash: text("admin_password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RestaurantConfigRow = typeof restaurantConfig.$inferSelect;
