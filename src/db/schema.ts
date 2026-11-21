import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  date,
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
    allergens: text("allergens").array().notNull().default(sql`'{}'::text[]`),
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
    emailStatus: text("email_status").notNull().default("pending"),
    paymentMethod: text("payment_method").notNull().default("pay_on_collection"),
    paymentStatus: text("payment_status").notNull().default("unpaid"),
    stripeSessionId: text("stripe_session_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
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
 * Anonymous page views of the public website, shown as a "Site visits" counter
 * in the admin sidebar footer. Admin and API routes are never recorded.
 *
 * visitorKey is a salted hash that is re-keyed every London day, so it can
 * answer "distinct visitors today" without being able to follow a person
 * across days. No IP address, cookie or full URL is stored.
 */
export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    ctaText: text("cta_text").notNull(),
    ctaLink: text("cta_link").notNull(),
    imageData: text("image_data"),
    startsOn: date("starts_on", { mode: "string" }).notNull(),
    endsOn: date("ends_on", { mode: "string" }).notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("offers_enabled_dates_order_idx").on(t.enabled, t.startsOn, t.endsOn, t.displayOrder)],
);

export const siteVisits = pgTable(
  "site_visits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    path: text("path").notNull(),
    visitorKey: text("visitor_key"),
    referrer: text("referrer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("site_visits_created_idx").on(t.createdAt),
    index("site_visits_path_idx").on(t.path),
  ],
);
