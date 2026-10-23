import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { OrderOption } from "../lib/types";

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => menuCategories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    pricePence: integer("price_pence").notNull(),
    dietary: text("dietary").array().notNull().default(sql`'{}'::text[]`),
    available: boolean("available").notNull().default(true),
    visible: boolean("visible").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("menu_items_category_idx").on(t.categoryId)],
);

/**
 * Option groups (e.g. "Choice of Protein", "Spice Level") can belong to a whole
 * category (applies to every dish in it) or to a single dish.
 */
export const optionGroups = pgTable("option_groups", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => menuCategories.id, { onDelete: "cascade" }),
  itemId: integer("item_id").references(() => menuItems.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  required: boolean("required").notNull().default(true),
  maxSelect: integer("max_select").notNull().default(1),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const optionChoices = pgTable(
  "option_choices",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => optionGroups.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    pricePence: integer("price_pence").notNull().default(0),
    available: boolean("available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("option_choices_group_idx").on(t.groupId)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    instructions: text("instructions"),
    collectionDate: text("collection_date").notNull(),
    collectionTime: text("collection_time").notNull(),
    subtotalPence: integer("subtotal_pence").notNull(),
    itemCount: integer("item_count").notNull(),
    status: text("status").notNull().default("new"),
    paymentMethod: text("payment_method").notNull().default("pay_on_collection"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    isDemo: boolean("is_demo").notNull().default(false),
    emailStatus: text("email_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_collection_idx").on(t.collectionDate, t.collectionTime),
  ],
);
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    orders: integer("orders"),
    spend: numeric("spend"),
    lastOrderDate: text("last_order_date"),
    marketingConsent: text("marketing_consent"),
    source: text("source"),
  }
);

export const gloriaFoodCustomers = pgTable(
  "gloriafoodsexport",
  {
    clientId: integer("client_id"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    marketingConsent: text("marketing_consent"),
    consentType: text("consent_type"),
    totalOrders: integer("total_orders"),
    totalSpent: text("total_spent"),
    lastOrderDate: text("last_order_date_(yyyy-mm-dd)"),
    lastOrder: text("last_order"),
  }
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    menuItemId: integer("menu_item_id"),
    name: text("name").notNull(),
    options: jsonb("options").$type<OrderOption[]>().notNull().default(sql`'[]'::jsonb`),
    unitPricePence: integer("unit_price_pence").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalPence: integer("line_total_pence").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  partySize: integer("party_size").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  orderingEnabled: boolean("ordering_enabled").notNull().default(true),
  pausedMessage: text("paused_message"),
  leadTimeMinutes: integer("lead_time_minutes").notNull().default(20),
  slotIntervalMinutes: integer("slot_interval_minutes").notNull().default(15),
  maxDaysAhead: integer("max_days_ahead").notNull().default(7),
  closedDates: text("closed_dates").array().notNull().default(sql`'{}'::text[]`),
  notificationEmail: text("notification_email"),
  announcement: text("announcement"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Additive business-dashboard tables. Created with IF NOT EXISTS by
 * ensureBusinessTables() — not part of the original menu/order migration,
 * so existing databases are left untouched until that helper runs.
 */
export const businessSettings = pgTable("business_settings", {
  id: integer("id").primaryKey(),
  openingHours: jsonb("opening_hours").$type<Record<string, { closed: boolean; open: string; close: string }>>().notNull(),
  holidayHours: jsonb("holiday_hours").$type<
    { id: string; date: string; closed: boolean; open: string | null; close: string | null; note: string }[]
  >().notNull(),
  specialEvents: jsonb("special_events").$type<
    { id: string; title: string; date: string; endDate: string | null; description: string }[]
  >().notNull(),
  contact: jsonb("contact").$type<{
    phoneDisplay: string;
    email: string;
    street: string;
    locality: string;
    postcode: string;
  }>().notNull(),
  notices: jsonb("notices").$type<{ id: string; title: string; body: string; active: boolean }[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const seoOverrides = pgTable("seo_overrides", {
  id: serial("id").primaryKey(),
  path: text("path").notNull().unique(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * White-label platform tables (additive, created with IF NOT EXISTS by
 * ensureBusinessTables). `restaurant_profile` is the single-row source of
 * truth for branding, contact details, ordering/delivery and payment
 * configuration — see src/lib/restaurant.ts.
 */
export const restaurantProfile = pgTable("restaurant_profile", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().default("Demo Restaurant"),
  tagline: text("tagline"),
  description: text("description"),
  cuisine: text("cuisine"),
  heroHeadline: text("hero_headline"),
  heroSubheadline: text("hero_subheadline"),
  aboutText: text("about_text"),
  email: text("email"),
  phoneDisplay: text("phone_display").notNull().default("020 7946 0958"),
  street: text("street").notNull().default("1 High Street"),
  locality: text("locality").notNull().default("Your Town"),
  region: text("region"),
  postcode: text("postcode").notNull().default("AB1 2CD"),
  country: text("country").notNull().default("GB"),
  geoLat: doublePrecision("geo_lat"),
  geoLng: doublePrecision("geo_lng"),
  googlePlaceId: text("google_place_id"),
  googleReviewUrl: text("google_review_url"),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  aboutImageUrl: text("about_image_url"),
  galleryImages: jsonb("gallery_images").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  primaryColor: text("primary_color").notNull().default("#c9a14a"),
  secondaryColor: text("secondary_color").notNull().default("#6b4226"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  tripadvisorUrl: text("tripadvisor_url"),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(false),
  deliveryUrl: text("delivery_url"),
  deliveryLabel: text("delivery_label"),
  deliveryFeePence: integer("delivery_fee_pence").notNull().default(0),
  deliveryMinOrderPence: integer("delivery_min_order_pence").notNull().default(0),
  deliveryNotes: text("delivery_notes"),
  collectionEnabled: boolean("collection_enabled").notNull().default(true),
  collectionInstructions: text("collection_instructions"),
  payOnCollection: boolean("pay_on_collection").notNull().default(true),
  payOnlineEnabled: boolean("pay_online_enabled").notNull().default(false),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeTestMode: boolean("stripe_test_mode").notNull().default(true),
  currency: text("currency").notNull().default("GBP"),
  timezone: text("timezone").notNull().default("Europe/London"),
  locale: text("locale").notNull().default("en-GB"),
  setupCompleted: boolean("setup_completed").notNull().default(false),
  demoMode: boolean("demo_mode").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Audit trail for menu imports (CSV / Excel / PDF). Draft payloads are reviewed in the admin UI before publishing. */
export const menuImports = pgTable("menu_imports", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  sourceType: text("source_type").notNull().default("csv"),
  status: text("status").notNull().default("published"),
  categoryCount: integer("category_count").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
