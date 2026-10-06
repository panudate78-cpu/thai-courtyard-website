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
const mapsQuery = encodeURIComponent("Thai Courtyard, 105 Walton Road, East Molesey KT8 0DR");

export const SITE = {
  name: "Thai Courtyard",
  fullName: "Thai Courtyard East Molesey",
  tagline: "Authentic Thai Cuisine in the Heart of East Molesey",
  description:
    "Authentic Thai restaurant on Walton Road, East Molesey. Warm, cosy and family-friendly — Dine in, book a table or order online for collection and pay when you collect.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.thaicourtyardmolesey.co.uk").replace(/\/$/, ""),
  phoneDisplay: "020 8941 3595",
  phoneHref: "tel:+442089413595",
  phoneIntl: "+44 20 8941 3595",
  address: {
    street: "105 Walton Road",
    locality: "East Molesey",
    region: "Surrey",
    postcode: "KT8 0DR",
    country: "GB",
  },
  addressLine: "105 Walton Road, East Molesey, KT8 0DR",
  geo: { lat: 51.40061537335302, lng: -0.35573498220902167 },
  deliverooUrl:
    "https://deliveroo.co.uk/menu/london/east-molesey-and-hampton-court/thai-courtyard-walton-road-105-walton-road",
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
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order Collection" },
  { href: "/book", label: "Book a Table" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
