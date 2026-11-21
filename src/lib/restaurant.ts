import { cache } from "react";
import { pool } from "@/db";
import { SITE as FALLBACK_SITE, OPENING_HOURS as FALLBACK_HOURS, DAY_NAMES } from "./site";

/**
 * DB-backed restaurant config — merges restaurant_config row over hardcoded Thai Courtyard fallback.
 * Keeps live Thai Courtyard 100% intact when DB is empty/missing; new white-label clients get their own row via /setup.
 */

export type OpeningHoursMap = Record<string, { open: string; close: string } | null>;

export type PaymentMode = "pay_on_collection" | "stripe_online" | "customer_choice";

export type RestaurantConfig = {
  id: number;
  setupCompleted: boolean;
  restaurantName: string;
  fullName: string;
  tagline: string;
  description: string;
  shortDescription: string;
  addressStreet: string;
  addressLocality: string;
  addressRegion: string;
  addressPostcode: string;
  addressCountry: string;
  addressLine: string;
  geoLat: number;
  geoLng: number;
  phoneDisplay: string;
  phoneHref: string;
  phoneIntl: string;
  email: string;
  orderEmail: string | null;
  deliverooUrl: string;
  googlePlaceId: string;
  googleReviewUrl: string;
  googleMapsUrl: string;
  googleDirectionsUrl: string;
  googleMapsEmbedUrl: string;
  openingHours: OpeningHoursMap;
  areaServed: string[];
  priceRange: string;
  servesCuisine: string[];
  currenciesAccepted: string;
  paymentAccepted: string;
  foundingLocation: string;
  hoursSummary: string;
  hoursShort: string;
  paymentNotice: string;
  announcement: string | null;
  themePrimary: string;
  themeAccent: string;
  fontPreset: string;
  logoUrl: string;
  heroImageUrl: string;
  galleryUrls: string[];
  ogImageUrl: string;
  heroTitle: string | null;
  heroIntro: string | null;
  aboutTitle: string;
  aboutIntro: string;
  aboutStory: string | null;
  slotIntervalMinutes: number;
  leadTimeMinutes: number;
  maxDaysAhead: number;
  closedDates: string[];
  siteUrl: string;
  emailFrom: string | null;
  restaurantEmail: string | null;
  paymentMode: PaymentMode;
  adminPasswordHash: string | null;
  raw: Record<string, unknown> | null;
};

function toNumber(v: string | number | null | undefined, fallback: number) {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildMapsQuery(street: string, locality: string, postcode: string, name: string) {
  return encodeURIComponent(`${name}, ${street}, ${locality} ${postcode}`);
}

function buildDerived(row: Record<string, unknown> | null): RestaurantConfig | null {
  if (!row) return null;
  const get = (k: string, fb: string) => (typeof row[k] === "string" && (row[k] as string).trim() ? (row[k] as string) : fb);
  const street = get("address_street", FALLBACK_SITE.address.street);
  const locality = get("address_locality", FALLBACK_SITE.address.locality);
  const postcode = get("address_postcode", FALLBACK_SITE.address.postcode);
  const region = get("address_region", FALLBACK_SITE.address.region);
  const country = get("address_country", FALLBACK_SITE.address.country);
  const name = get("restaurant_name", FALLBACK_SITE.name);
  const lat = toNumber(row["geo_lat"] as string, FALLBACK_SITE.geo.lat);
  const lng = toNumber(row["geo_lng"] as string, FALLBACK_SITE.geo.lng);
  const mapsQuery = buildMapsQuery(street, locality, postcode, name);
  const placeId = typeof row["google_place_id"] === "string" ? (row["google_place_id"] as string) : "";
  const deliveroo = get("deliveroo_url", FALLBACK_SITE.deliverooUrl);
  const siteUrl = (get("site_url", FALLBACK_SITE.url) || FALLBACK_SITE.url).replace(/\/$/, "");
  const googleReview =
    (typeof row["google_review_url"] === "string" && (row["google_review_url"] as string).trim()
      ? (row["google_review_url"] as string)
      : "") ||
    (placeId ? `https://search.google.com/local/writereview?placeid=${placeId}` : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`);
  const googleMaps =
    (typeof row["google_maps_url"] === "string" && (row["google_maps_url"] as string).trim()
      ? (row["google_maps_url"] as string)
      : "") ||
    (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`);

  const openingRaw = row["opening_hours"] as OpeningHoursMap | null;
  const openingHours: OpeningHoursMap = openingRaw && typeof openingRaw === "object" ? openingRaw : (FALLBACK_HOURS as unknown as OpeningHoursMap);

  const rawMode = typeof row["payment_mode"] === "string" ? (row["payment_mode"] as string) : "pay_on_collection";
  const paymentMode: PaymentMode = rawMode === "stripe_online" || rawMode === "customer_choice" ? (rawMode as PaymentMode) : "pay_on_collection";

  const area = Array.isArray(row["area_served"]) ? (row["area_served"] as string[]) : FALLBACK_SITE.areaServed.slice();
  const cuisine = Array.isArray(row["serves_cuisine"]) ? (row["serves_cuisine"] as string[]) : [...FALLBACK_SITE.servesCuisine];

  return {
    id: Number(row["id"] ?? 1),
    setupCompleted: Boolean(row["setup_completed"]),
    restaurantName: name,
    fullName: get("full_name", FALLBACK_SITE.fullName),
    tagline: get("tagline", FALLBACK_SITE.tagline),
    description: get("description", FALLBACK_SITE.description),
    shortDescription: get("short_description", FALLBACK_SITE.shortDescription),
    addressStreet: street,
    addressLocality: locality,
    addressRegion: region,
    addressPostcode: postcode,
    addressCountry: country,
    addressLine: `${street}, ${locality}, ${postcode}`,
    geoLat: lat,
    geoLng: lng,
    phoneDisplay: get("phone_display", FALLBACK_SITE.phoneDisplay),
    phoneHref: get("phone_href", FALLBACK_SITE.phoneHref),
    phoneIntl: get("phone_intl", FALLBACK_SITE.phoneIntl),
    email: get("email", FALLBACK_SITE.email),
    orderEmail: (row["order_email"] as string) || null,
    deliverooUrl: deliveroo,
    googlePlaceId: placeId,
    googleReviewUrl: googleReview,
    googleMapsUrl: googleMaps,
    googleDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}${placeId ? `&destination_place_id=${placeId}` : ""}`,
    googleMapsEmbedUrl: `https://www.google.com/maps?q=${mapsQuery}&z=16&output=embed`,
    openingHours,
    areaServed: area,
    priceRange: get("price_range", FALLBACK_SITE.priceRange),
    servesCuisine: cuisine,
    currenciesAccepted: get("currencies_accepted", FALLBACK_SITE.currenciesAccepted),
    paymentAccepted: get("payment_accepted", FALLBACK_SITE.paymentAccepted),
    foundingLocation: get("founding_location", FALLBACK_SITE.foundingLocation),
    hoursSummary: get("hours_summary", FALLBACK_SITE.hoursSummary),
    hoursShort: get("hours_short", FALLBACK_SITE.hoursShort),
    paymentNotice: get("payment_notice", FALLBACK_SITE.paymentNotice),
    announcement: (row["announcement"] as string) || null,
    paymentMode,
    themePrimary: get("theme_primary", "#1a2a3a"),
    themeAccent: get("theme_accent", "#c9a86a"),
    fontPreset: get("font_preset", "serif-sans"),
    logoUrl: get("logo_url", "/images/logo.png"),
    heroImageUrl: get("hero_image_url", "/images/hero-spread.jpg"),
    galleryUrls: Array.isArray(row["gallery_urls"]) ? (row["gallery_urls"] as string[]) : [],
    ogImageUrl: get("og_image_url", "/opengraph-image"),
    heroTitle: (row["hero_title"] as string) || null,
    heroIntro: (row["hero_intro"] as string) || null,
    aboutTitle: get("about_title", "About Thai Courtyard"),
    aboutIntro: get("about_intro", FALLBACK_SITE.description),
    aboutStory: (row["about_story"] as string) || null,
    slotIntervalMinutes: toNumber(row["slot_interval_minutes"] as number, 15),
    leadTimeMinutes: toNumber(row["lead_time_minutes"] as number, 20),
    maxDaysAhead: toNumber(row["max_days_ahead"] as number, 7),
    closedDates: Array.isArray(row["closed_dates"]) ? (row["closed_dates"] as string[]) : [],
    siteUrl,
    emailFrom: (row["email_from"] as string) || null,
    restaurantEmail: (row["restaurant_email"] as string) || null,
    adminPasswordHash: (row["admin_password_hash"] as string) || null,
    raw: row,
  };
}

// Cached per-request, plus a tiny global memo for build/edge where cache() is not enough
let globalMemo: { config: RestaurantConfig | null; at: number } | null = null;

export const getRestaurantConfig = cache(async (): Promise<RestaurantConfig> => {
  // Global memo 5s to avoid hammering DB during build (many generateMetadata calls)
  if (globalMemo && Date.now() - globalMemo.at < 5000 && globalMemo.config) return globalMemo.config;

  // Fallback site as config (DB not ready or row missing)
  const fallbackDerived = buildDerived({
    id: 1,
    setup_completed: false,
    restaurant_name: FALLBACK_SITE.name,
    full_name: FALLBACK_SITE.fullName,
    tagline: FALLBACK_SITE.tagline,
    description: FALLBACK_SITE.description,
    short_description: FALLBACK_SITE.shortDescription,
    address_street: FALLBACK_SITE.address.street,
    address_locality: FALLBACK_SITE.address.locality,
    address_region: FALLBACK_SITE.address.region,
    address_postcode: FALLBACK_SITE.address.postcode,
    address_country: FALLBACK_SITE.address.country,
    geo_lat: String(FALLBACK_SITE.geo.lat),
    geo_lng: String(FALLBACK_SITE.geo.lng),
    phone_display: FALLBACK_SITE.phoneDisplay,
    phone_href: FALLBACK_SITE.phoneHref,
    phone_intl: FALLBACK_SITE.phoneIntl,
    email: FALLBACK_SITE.email,
    deliveroo_url: FALLBACK_SITE.deliverooUrl,
    google_place_id: "",
    google_review_url: "",
    area_served: FALLBACK_SITE.areaServed,
    site_url: FALLBACK_SITE.url,
    payment_mode: "pay_on_collection",
  } as Record<string, unknown>);

  try {
    const { rows } = await pool.query(`SELECT * FROM restaurant_config WHERE id=1 LIMIT 1`);
    const row = rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      globalMemo = { config: fallbackDerived!, at: Date.now() };
      return fallbackDerived!;
    }
    const derived = buildDerived(row);
    if (!derived) {
      globalMemo = { config: fallbackDerived!, at: Date.now() };
      return fallbackDerived!;
    }
    // If setup never completed and DB still has Thai Courtyard seed, honour env overrides for email/site
    if (!derived.setupCompleted) {
      // Allow NEXT_PUBLIC_SITE_URL and CONTACT_EMAIL env to win for Thai Courtyard live before wizard
      const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
      if (envUrl) derived.siteUrl = envUrl;
      const envEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
      if (envEmail) derived.email = envEmail;
      const envReview = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;
      if (envReview) derived.googleReviewUrl = envReview;
    }
    globalMemo = { config: derived, at: Date.now() };
    return derived;
  } catch {
    globalMemo = { config: fallbackDerived!, at: Date.now() };
    return fallbackDerived!;
  }
});

// Synchronous fallback for places that cannot be async (e.g. lib/site SITE export stays as before)
export function getFallbackSite() {
  return FALLBACK_SITE;
}

export async function isSetupCompleted(): Promise<boolean> {
  try {
    const cfg = await getRestaurantConfig();
    return cfg.setupCompleted;
  } catch {
    return false;
  }
}
