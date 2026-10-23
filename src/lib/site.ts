/**
 * Platform-wide *fallback* defaults.
 *
 * Everything restaurant-specific is stored in the database (restaurant
 * profile + business settings) and edited in Admin → Restaurant or the
 * first-run Setup Wizard (`/setup`). The values below are only used before
 * setup has been completed — e.g. for the bundled demo restaurant — or when
 * the database is temporarily unreachable. They must stay brand-neutral:
 * a new client deployment should never need to edit this file.
 *
 * Environment overrides (no code change needed):
 * - NEXT_PUBLIC_SITE_URL        canonical site URL, e.g. https://www.example.co.uk
 * - NEXT_PUBLIC_GOOGLE_PLACE_ID Google Place ID for maps / review links
 */

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/** Default opening hours keyed by JS weekday (0 = Sunday … 6 = Saturday). Closed Mondays. */
export const DEFAULT_OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: "12:00", close: "21:00" },
  1: null,
  2: { open: "12:00", close: "22:00" },
  3: { open: "12:00", close: "22:00" },
  4: { open: "12:00", close: "22:00" },
  5: { open: "12:00", close: "22:00" },
  6: { open: "12:00", close: "22:00" },
};

/** Backwards-compatible alias — prefer DEFAULT_OPENING_HOURS in new code. */
export const OPENING_HOURS = DEFAULT_OPENING_HOURS;

export const DEFAULT_RESTAURANT = {
  name: "Demo Restaurant",
  tagline: "Fresh food, warm welcome",
  description:
    "A neighbourhood restaurant serving freshly prepared food. Dine in, book a table, or order online for collection and pay when you collect.",
  cuisine: "Modern British",
  heroHeadline: "Freshly prepared, made to be shared",
  heroSubheadline:
    "Join us in the dining room, book a table for a celebration, or order online and collect — the same kitchen, whichever you choose.",
  aboutText:
    "We are an independent neighbourhood restaurant serving freshly prepared food in a relaxed, welcoming dining room. Every dish is cooked to order, and our team is here to make every visit — from a quick weekday lunch to a family celebration — feel easy and special.",
  email: "hello@example.co.uk",
  phoneDisplay: "020 7946 0958",
  street: "1 High Street",
  locality: "Your Town",
  region: "",
  postcode: "AB1 2CD",
  country: "GB",
  logoUrl: "/images/logo.svg",
  heroImageUrl: "/images/demo-hero.jpg",
  aboutImageUrl: "/images/demo-interior.jpg",
  primaryColor: "#c9a14a",
  secondaryColor: "#6b4226",
  currency: "GBP",
  timezone: "Europe/London",
  locale: "en-GB",
} as const;

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Collection" },
  { href: "/book", label: "Book a Table" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

/** Colour palettes offered in the Setup Wizard / Business Settings. */
export const COLOUR_PRESETS = [
  { name: "Classic Gold", primary: "#c9a14a", secondary: "#6b4226" },
  { name: "Forest Green", primary: "#7fb069", secondary: "#2f5d4f" },
  { name: "Terracotta", primary: "#d97b4f", secondary: "#7a3b2e" },
  { name: "Ocean Blue", primary: "#5aa9e6", secondary: "#274c77" },
  { name: "Berry", primary: "#c25e7a", secondary: "#6d2e46" },
  { name: "Charcoal & Lime", primary: "#b5c99a", secondary: "#3f4a3c" },
  { name: "Sunset Red", primary: "#e07a5f", secondary: "#9c3848" },
  { name: "Monochrome", primary: "#d6d3d1", secondary: "#44403c" },
] as const;
