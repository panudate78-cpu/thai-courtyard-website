/** Opening hours keyed by JS weekday (0 = Sunday … 6 = Saturday). */
export const OPENING_HOURS: Record<number, { open: string; close: string } | null> = {
  0: null,
  1: null,
  2: { open: "12:00", close: "21:00" },
  3: { open: "12:00", close: "21:00" },
  4: { open: "12:00", close: "21:00" },
  5: { open: "12:00", close: "21:00" },
  6: { open: "12:00", close: "21:00" },
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "";
// Generic demo placeholder — replace via /setup wizard (restaurant_config) for each restaurant.
// Thai Courtyard live data stays on thai-courtyard-website main via DB seed; this fallback is for the template.
const mapsQuery = encodeURIComponent("Demo Restaurant, 123 High Street, Sample Town KT9 1AB");

export const SITE = {
  name: "Demo Restaurant",
  fullName: "Demo Restaurant Sample Town",
  tagline: "Fresh seasonal dining in Sample Town",
  description:
    "Sample restaurant on High Street, Sample Town — warm, welcoming and family-friendly. Dine in, book a table or order takeaway online for collection. Pay on collection.",
  shortDescription:
    "Family-friendly restaurant in Sample Town — dine in, takeaway collection & delivery. Fresh seasonal food cooked to order.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.example.com").replace(/\/$/, ""),
  phoneDisplay: "020 1234 5678",
  phoneHref: "tel:+442012345678",
  phoneIntl: "+44 20 1234 5678",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@example.com",
  address: {
    street: "123 High Street",
    locality: "Sample Town",
    region: "Surrey",
    postcode: "KT9 1AB",
    country: "GB",
  },
  addressLine: "123 High Street, Sample Town, KT9 1AB",
  geo: { lat: 51.5074, lng: -0.1278 },
  // Extended geo for local SEO — overwritten by restaurant_config.area_served via /setup
  areaServed: [
    "Sample Town",
    "Riverside",
    "Hilltop",
    "Westfield",
    "Northwood",
    "Eastford",
    "Southgate",
    "Meadowbank",
    "Kingston",
    "Richmond",
  ],
  deliverooUrl: "",
  googleMapsUrl: placeId
    ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  googleDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}${
    placeId ? `&destination_place_id=${placeId}` : ""
  }`,
  googleReviewUrl:
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    (placeId
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`),
  googleMapsEmbedUrl: `https://www.google.com/maps?q=${mapsQuery}&z=16&output=embed`,
  paymentNotice: "Payment will be taken in restaurant when you collect your order. We accept cash and card.",
  newManagement: "",
  hoursSummary: "Tuesday – Saturday, 12:00 – 21:00",
  hoursShort: "Tue – Sat · 12:00 – 21:00",
  // Business identifiers for SEO trust
  priceRange: "££",
  currenciesAccepted: "GBP",
  paymentAccepted: "Cash, Credit Card, Debit Card",
  servesCuisine: ["International", "European"] as const,
  foundingLocation: "Sample Town, Surrey",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Collection" },
  { href: "/book", label: "Book a Table" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
