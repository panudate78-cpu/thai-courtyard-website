import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { ensureBusinessTables } from "@/db/business-migration";
import { restaurantProfile } from "@/db/schema";
import { getBusinessSettings } from "@/lib/business/settings-store";
import { DEFAULT_OPENING_HOURS, DEFAULT_RESTAURANT, DAY_NAMES, siteUrl } from "./site";
import { EMAIL_RE } from "./validation";

/**
 * The single source of truth for everything restaurant-specific.
 *
 * Stored in `restaurant_profile` (id = 1) + `business_settings` (hours /
 * holidays) and edited via Admin → Restaurant or the Setup Wizard.
 * Public pages must read branding/contact/hours from here — never hardcode
 * a client name, phone number, address or colour in a component.
 */

export type OpeningHoursRecord = Record<number, { open: string; close: string } | null>;

export type RestaurantConfig = {
  name: string;
  fullName: string;
  tagline: string;
  description: string;
  cuisine: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  url: string;
  email: string;
  phoneDisplay: string;
  phoneHref: string;
  phoneIntl: string;
  address: { street: string; locality: string; region: string; postcode: string; country: string };
  addressLine: string;
  geo: { lat: number; lng: number } | null;
  googlePlaceId: string;
  googleMapsUrl: string;
  googleDirectionsUrl: string;
  googleReviewUrl: string;
  googleMapsEmbedUrl: string;
  logoUrl: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  galleryImages: string[];
  primaryColor: string;
  secondaryColor: string;
  social: { facebook: string; instagram: string; tripadvisor: string };
  delivery: { enabled: boolean; url: string; label: string; feePence: number; minOrderPence: number; notes: string };
  collection: { enabled: boolean; instructions: string };
  payments: {
    payOnCollection: boolean;
    payOnlineEnabled: boolean; // Stripe checkout is not wired up yet — see docs/architecture.md
    stripePublishableKey: string;
    stripeTestMode: boolean;
  };
  paymentNotice: string;
  openingHours: OpeningHoursRecord;
  hoursSummary: string;
  hoursShort: string;
  currency: string;
  timezone: string;
  locale: string;
  setupCompleted: boolean;
  demoMode: boolean;
  announcement: string;
};

export type RestaurantProfileInput = {
  name: string;
  tagline: string;
  description: string;
  cuisine: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  email: string;
  phoneDisplay: string;
  street: string;
  locality: string;
  region: string;
  postcode: string;
  country: string;
  geoLat: number | null;
  geoLng: number | null;
  googlePlaceId: string;
  googleReviewUrl: string;
  logoUrl: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  galleryImages: string[];
  primaryColor: string;
  secondaryColor: string;
  facebookUrl: string;
  instagramUrl: string;
  tripadvisorUrl: string;
  deliveryEnabled: boolean;
  deliveryUrl: string;
  deliveryLabel: string;
  deliveryFeePence: number;
  deliveryMinOrderPence: number;
  deliveryNotes: string;
  collectionEnabled: boolean;
  collectionInstructions: string;
  payOnCollection: boolean;
  payOnlineEnabled: boolean;
  stripePublishableKey: string;
  stripeTestMode: boolean;
  currency: string;
  timezone: string;
  locale: string;
  setupCompleted: boolean;
  demoMode: boolean;
};

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #c9a14a");

const urlOrPath = z
  .string()
  .trim()
  .max(2_000_000) // data: URLs for uploaded logos
  .refine(
    (v) => v === "" || v.startsWith("/") || v.startsWith("https://") || v.startsWith("http://") || v.startsWith("data:image/"),
    "Use an https:// link, a /images/... path, or upload an image",
  );

export const restaurantProfileSchema = z.object({
  name: z.string().trim().min(2, "Enter the restaurant name").max(80),
  tagline: z.string().trim().max(120),
  description: z.string().trim().max(400),
  cuisine: z.string().trim().max(80),
  heroHeadline: z.string().trim().max(120),
  heroSubheadline: z.string().trim().max(300),
  aboutText: z.string().trim().max(3000),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || EMAIL_RE.test(v), "Enter a valid email or leave it blank"),
  phoneDisplay: z.string().trim().min(7, "Enter a phone number").max(25),
  street: z.string().trim().min(2).max(120),
  locality: z.string().trim().min(2).max(80),
  region: z.string().trim().max(80),
  postcode: z.string().trim().min(3).max(12),
  country: z.string().trim().min(2).max(4),
  geoLat: z.number().min(-90).max(90).nullable(),
  geoLng: z.number().min(-180).max(180).nullable(),
  googlePlaceId: z.string().trim().max(120),
  googleReviewUrl: urlOrPath,
  logoUrl: urlOrPath,
  heroImageUrl: urlOrPath,
  aboutImageUrl: urlOrPath,
  galleryImages: z.array(urlOrPath).max(12),
  primaryColor: hex,
  secondaryColor: hex,
  facebookUrl: urlOrPath,
  instagramUrl: urlOrPath,
  tripadvisorUrl: urlOrPath,
  deliveryEnabled: z.boolean(),
  deliveryUrl: urlOrPath,
  deliveryLabel: z.string().trim().max(60),
  deliveryFeePence: z.number().int().min(0).max(100_000),
  deliveryMinOrderPence: z.number().int().min(0).max(1_000_000),
  deliveryNotes: z.string().trim().max(400),
  collectionEnabled: z.boolean(),
  collectionInstructions: z.string().trim().max(500),
  payOnCollection: z.boolean(),
  payOnlineEnabled: z.boolean(),
  stripePublishableKey: z.string().trim().max(200),
  stripeTestMode: z.boolean(),
  currency: z.string().trim().min(3).max(3),
  timezone: z.string().trim().min(3).max(60),
  locale: z.string().trim().min(2).max(10),
  setupCompleted: z.boolean(),
  demoMode: z.boolean(),
});

export function defaultProfileInput(): RestaurantProfileInput {
  const d = DEFAULT_RESTAURANT;
  return {
    name: d.name,
    tagline: d.tagline,
    description: d.description,
    cuisine: d.cuisine,
    heroHeadline: d.heroHeadline,
    heroSubheadline: d.heroSubheadline,
    aboutText: d.aboutText,
    email: d.email,
    phoneDisplay: d.phoneDisplay,
    street: d.street,
    locality: d.locality,
    region: d.region,
    postcode: d.postcode,
    country: d.country,
    geoLat: null,
    geoLng: null,
    googlePlaceId: process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "",
    googleReviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "",
    logoUrl: d.logoUrl,
    heroImageUrl: d.heroImageUrl,
    aboutImageUrl: d.aboutImageUrl,
    galleryImages: ["/images/demo-dish-1.jpg", "/images/demo-dish-2.jpg", "/images/demo-interior.jpg", "/images/demo-hero.jpg"],
    primaryColor: d.primaryColor,
    secondaryColor: d.secondaryColor,
    facebookUrl: "",
    instagramUrl: "",
    tripadvisorUrl: "",
    deliveryEnabled: false,
    deliveryUrl: "",
    deliveryLabel: "Order Delivery",
    deliveryFeePence: 0,
    deliveryMinOrderPence: 0,
    deliveryNotes: "",
    collectionEnabled: true,
    collectionInstructions: "",
    payOnCollection: true,
    payOnlineEnabled: false,
    stripePublishableKey: "",
    stripeTestMode: true,
    currency: d.currency,
    timezone: d.timezone,
    locale: d.locale,
    setupCompleted: false,
    demoMode: true,
  };
}

function phoneHref(display: string) {
  const digits = display.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return `tel:${digits}`;
  if (digits.startsWith("0")) return `tel:+44${digits.slice(1)}`;
  return `tel:${digits}`;
}

function phoneIntl(display: string) {
  const href = phoneHref(display).replace(/^tel:/, "");
  return href.startsWith("+") ? href : display;
}

function summariseHours(hours: OpeningHoursRecord) {
  const open: { day: number; open: string; close: string }[] = [];
  for (let day = 0; day < 7; day += 1) {
    const h = hours[day];
    if (h) open.push({ day, open: h.open, close: h.close });
  }
  if (!open.length) return { summary: "Opening hours to be confirmed", short: "Hours TBC" };
  // Group consecutive Mon-first runs sharing the same hours.
  const order = [1, 2, 3, 4, 5, 6, 0];
  const runs: { from: number; to: number; open: string; close: string }[] = [];
  for (const day of order) {
    const h = hours[day];
    if (!h) continue;
    const last = runs[runs.length - 1];
    if (last && last.open === h.open && last.close === h.close && order.indexOf(last.to) === order.indexOf(day) - 1) {
      last.to = day;
    } else {
      runs.push({ from: day, to: day, open: h.open, close: h.close });
    }
  }
  const long = runs
    .map((r) => `${r.from === r.to ? DAY_NAMES[r.from] : `${DAY_NAMES[r.from]} – ${DAY_NAMES[r.to]}`}, ${r.open} – ${r.close}`)
    .join("; ");
  const shortDay = (d: number) => DAY_NAMES[d].slice(0, 3);
  const short = runs
    .map((r) => `${r.from === r.to ? shortDay(r.from) : `${shortDay(r.from)} – ${shortDay(r.to)}`} · ${r.open} – ${r.close}`)
    .join("; ");
  return { summary: long, short };
}

export function buildConfig(profile: RestaurantProfileInput, openingHours: OpeningHoursRecord, announcement = ""): RestaurantConfig {
  const url = siteUrl();
  const placeId = profile.googlePlaceId || process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "";
  const addressLine = [profile.street, profile.locality, profile.postcode].filter(Boolean).join(", ");
  const mapsQuery = encodeURIComponent(`${profile.name}, ${addressLine}`);
  const hours = summariseHours(openingHours);
  return {
    name: profile.name,
    fullName: profile.locality ? `${profile.name} ${profile.locality}` : profile.name,
    tagline: profile.tagline,
    description: profile.description,
    cuisine: profile.cuisine,
    heroHeadline: profile.heroHeadline,
    heroSubheadline: profile.heroSubheadline,
    aboutText: profile.aboutText,
    url,
    email: profile.email,
    phoneDisplay: profile.phoneDisplay,
    phoneHref: phoneHref(profile.phoneDisplay),
    phoneIntl: phoneIntl(profile.phoneDisplay),
    address: {
      street: profile.street,
      locality: profile.locality,
      region: profile.region,
      postcode: profile.postcode,
      country: profile.country,
    },
    addressLine,
    geo: profile.geoLat != null && profile.geoLng != null ? { lat: profile.geoLat, lng: profile.geoLng } : null,
    googlePlaceId: placeId,
    googleMapsUrl: placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
    googleDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}${placeId ? `&destination_place_id=${placeId}` : ""}`,
    googleReviewUrl:
      profile.googleReviewUrl ||
      process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
      (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`),
    googleMapsEmbedUrl: `https://www.google.com/maps?q=${mapsQuery}&z=16&output=embed`,
    logoUrl: profile.logoUrl || DEFAULT_RESTAURANT.logoUrl,
    heroImageUrl: profile.heroImageUrl || DEFAULT_RESTAURANT.heroImageUrl,
    aboutImageUrl: profile.aboutImageUrl || DEFAULT_RESTAURANT.aboutImageUrl,
    galleryImages: profile.galleryImages.length
      ? profile.galleryImages
      : ["/images/demo-dish-1.jpg", "/images/demo-dish-2.jpg", "/images/demo-interior.jpg", "/images/demo-hero.jpg"],
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    social: { facebook: profile.facebookUrl, instagram: profile.instagramUrl, tripadvisor: profile.tripadvisorUrl },
    delivery: {
      enabled: profile.deliveryEnabled && Boolean(profile.deliveryUrl),
      url: profile.deliveryUrl,
      label: profile.deliveryLabel || "Order Delivery",
      feePence: profile.deliveryFeePence,
      minOrderPence: profile.deliveryMinOrderPence,
      notes: profile.deliveryNotes,
    },
    collection: { enabled: profile.collectionEnabled, instructions: profile.collectionInstructions },
    payments: {
      payOnCollection: profile.payOnCollection,
      payOnlineEnabled: profile.payOnlineEnabled,
      stripePublishableKey: profile.stripePublishableKey,
      stripeTestMode: profile.stripeTestMode,
    },
    paymentNotice: profile.payOnCollection
      ? "Payment will be taken in the restaurant when you collect your order. We accept cash and card."
      : "Please follow the payment instructions shown at checkout.",
    openingHours,
    hoursSummary: hours.summary,
    hoursShort: hours.short,
    currency: profile.currency,
    timezone: profile.timezone,
    locale: profile.locale,
    setupCompleted: profile.setupCompleted,
    demoMode: profile.demoMode,
    announcement,
  };
}

export function defaultConfig(): RestaurantConfig {
  return buildConfig(defaultProfileInput(), DEFAULT_OPENING_HOURS);
}

type ProfileRow = typeof restaurantProfile.$inferSelect;

function rowToInput(row: ProfileRow): RestaurantProfileInput {
  const d = defaultProfileInput();
  return {
    name: row.name || d.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    cuisine: row.cuisine ?? "",
    heroHeadline: row.heroHeadline ?? "",
    heroSubheadline: row.heroSubheadline ?? "",
    aboutText: row.aboutText ?? "",
    email: row.email ?? "",
    phoneDisplay: row.phoneDisplay || d.phoneDisplay,
    street: row.street || d.street,
    locality: row.locality || d.locality,
    region: row.region ?? "",
    postcode: row.postcode || d.postcode,
    country: row.country || d.country,
    geoLat: row.geoLat ?? null,
    geoLng: row.geoLng ?? null,
    googlePlaceId: row.googlePlaceId ?? "",
    googleReviewUrl: row.googleReviewUrl ?? "",
    logoUrl: row.logoUrl ?? "",
    heroImageUrl: row.heroImageUrl ?? "",
    aboutImageUrl: row.aboutImageUrl ?? "",
    galleryImages: Array.isArray(row.galleryImages) ? row.galleryImages : d.galleryImages,
    primaryColor: row.primaryColor || d.primaryColor,
    secondaryColor: row.secondaryColor || d.secondaryColor,
    facebookUrl: row.facebookUrl ?? "",
    instagramUrl: row.instagramUrl ?? "",
    tripadvisorUrl: row.tripadvisorUrl ?? "",
    deliveryEnabled: row.deliveryEnabled,
    deliveryUrl: row.deliveryUrl ?? "",
    deliveryLabel: row.deliveryLabel ?? "Order Delivery",
    deliveryFeePence: row.deliveryFeePence,
    deliveryMinOrderPence: row.deliveryMinOrderPence,
    deliveryNotes: row.deliveryNotes ?? "",
    collectionEnabled: row.collectionEnabled,
    collectionInstructions: row.collectionInstructions ?? "",
    payOnCollection: row.payOnCollection,
    payOnlineEnabled: row.payOnlineEnabled,
    stripePublishableKey: row.stripePublishableKey ?? "",
    stripeTestMode: row.stripeTestMode,
    currency: row.currency || d.currency,
    timezone: row.timezone || d.timezone,
    locale: row.locale || d.locale,
    setupCompleted: row.setupCompleted,
    demoMode: row.demoMode,
  };
}

export async function getRestaurantProfile(): Promise<RestaurantProfileInput> {
  await ensureDatabase();
  await ensureBusinessTables();
  const [row] = await db.select().from(restaurantProfile).where(eq(restaurantProfile.id, 1)).limit(1);
  return row ? rowToInput(row) : defaultProfileInput();
}

export async function saveRestaurantProfile(input: RestaurantProfileInput): Promise<RestaurantProfileInput> {
  await ensureDatabase();
  await ensureBusinessTables();
  const values = { ...input, id: 1, updatedAt: new Date() };
  await db
    .insert(restaurantProfile)
    .values(values)
    .onConflictDoUpdate({ target: restaurantProfile.id, set: { ...input, updatedAt: new Date() } });
  return getRestaurantProfile();
}

/** Opening-hours map from business settings (falls back to platform defaults). */
export async function getOpeningHoursMap(): Promise<OpeningHoursRecord> {
  try {
    const business = await getBusinessSettings();
    if (business.stored) {
      const map: OpeningHoursRecord = {};
      for (let day = 0; day < 7; day += 1) {
        const entry = business.openingHours[String(day) as keyof typeof business.openingHours];
        map[day] = entry && !entry.closed ? { open: entry.open, close: entry.close } : null;
      }
      return map;
    }
  } catch (error) {
    console.error("[restaurant] opening hours fallback", error);
  }
  return DEFAULT_OPENING_HOURS;
}

/** Holiday exceptions that affect slots/bookings (closed dates + custom hours). */
export async function getHolidayExceptions(): Promise<{ date: string; closed: boolean; open: string | null; close: string | null }[]> {
  try {
    const business = await getBusinessSettings();
    return business.holidayHours.map((h) => ({ date: h.date, closed: h.closed, open: h.open, close: h.close }));
  } catch {
    return [];
  }
}

export async function getRestaurantConfig(): Promise<RestaurantConfig> {
  const [profile, openingHours, business] = await Promise.all([
    getRestaurantProfile(),
    getOpeningHoursMap(),
    getBusinessSettings().catch(() => null),
  ]);
  return buildConfig(profile, openingHours, business?.announcement ?? "");
}

/** Never throws — safe for root/public layouts. */
export async function getRestaurantConfigSafe(): Promise<RestaurantConfig> {
  try {
    return await getRestaurantConfig();
  } catch (error) {
    console.error("[restaurant] config fallback to defaults", error);
    return defaultConfig();
  }
}

/** Brand CSS variables injected by the root layout so colours are configurable without a rebuild. */
export function brandCss(config: Pick<RestaurantConfig, "primaryColor" | "secondaryColor">) {
  return `:root{--color-gold:${config.primaryColor};--color-gold-light:${config.primaryColor};--color-teak:${config.secondaryColor};--color-teak-dark:${config.secondaryColor};--brand-primary:${config.primaryColor};--brand-secondary:${config.secondaryColor}}`;
}

export function slugifyName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "restaurant"
  );
}
