import { IMG } from "./image-manifest";
import { DAY_NAMES, OPENING_HOURS, SITE } from "./site";
import type { MenuCategory } from "./types";
import type { RestaurantConfig } from "./restaurant";

/** Resolve SITE-like values from a DB config if provided, otherwise fallback to hardcoded SITE. */
function resolveSite(cfg?: RestaurantConfig | null) {
  if (!cfg) return SITE as unknown as Record<string, unknown> & typeof SITE;
  return {
    name: cfg.restaurantName,
    fullName: cfg.fullName,
    description: cfg.description,
    shortDescription: cfg.shortDescription,
    url: cfg.siteUrl,
    phoneDisplay: cfg.phoneDisplay,
    phoneHref: cfg.phoneHref,
    phoneIntl: cfg.phoneIntl,
    email: cfg.email,
    address: {
      street: cfg.addressStreet,
      locality: cfg.addressLocality,
      region: cfg.addressRegion,
      postcode: cfg.addressPostcode,
      country: cfg.addressCountry,
    },
    addressLine: cfg.addressLine,
    geo: { lat: cfg.geoLat, lng: cfg.geoLng },
    areaServed: cfg.areaServed,
    deliverooUrl: cfg.deliverooUrl,
    googleMapsUrl: cfg.googleMapsUrl,
    googleDirectionsUrl: cfg.googleDirectionsUrl,
    googleReviewUrl: cfg.googleReviewUrl,
    googleMapsEmbedUrl: cfg.googleMapsEmbedUrl,
    paymentNotice: cfg.paymentNotice,
    hoursSummary: cfg.hoursSummary,
    hoursShort: cfg.hoursShort,
    priceRange: cfg.priceRange,
    currenciesAccepted: cfg.currenciesAccepted,
    paymentAccepted: cfg.paymentAccepted,
    servesCuisine: cfg.servesCuisine as unknown as typeof SITE.servesCuisine,
    foundingLocation: cfg.foundingLocation,
    tagline: cfg.tagline,
  } as unknown as typeof SITE;
}

function resolveHours(cfg?: RestaurantConfig | null) {
  if (cfg?.openingHours) return cfg.openingHours as unknown as typeof OPENING_HOURS;
  return OPENING_HOURS;
}

// -- Core JSON-LD builders ----------------------------------------------------

export function restaurantJsonLd(cfg?: RestaurantConfig | null) {
  const hours = resolveHours(cfg);
  const site = resolveSite(cfg);
  const openingHoursSpecification = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => (hours as Record<number, unknown>)[d])
    .map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[d as number]}`,
      opens: (hours as Record<number, { open: string; close: string }>)[d]!.open,
      closes: (hours as Record<number, { open: string; close: string }>)[d]!.close,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${site.url}/#restaurant`,
    name: site.name,
    alternateName: (site as unknown as typeof SITE).fullName,
    slogan: "Simply Delicious",
    description: site.description,
    url: site.url,
    telephone: (site as unknown as typeof SITE).phoneIntl,
    email: site.email,
    image: [
      IMG.heroSpread.src,
      IMG.thaiSpread.src,
      IMG.greenCurry.src,
      IMG.padThai.src,
      IMG.satay.src,
    ].map((src) => `${site.url}${src}`),
    logo: `${site.url}${IMG.logo.src}`,
    servesCuisine: [...((site as unknown as typeof SITE).servesCuisine as unknown as string[])],
    priceRange: (site as unknown as typeof SITE).priceRange,
    currenciesAccepted: (site as unknown as typeof SITE).currenciesAccepted,
    paymentAccepted: (site as unknown as typeof SITE).paymentAccepted,
    acceptsReservations: `${site.url}/book`,
    hasMenu: `${site.url}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: (site as unknown as typeof SITE).address.street,
      addressLocality: (site as unknown as typeof SITE).address.locality,
      addressRegion: (site as unknown as typeof SITE).address.region,
      postalCode: (site as unknown as typeof SITE).address.postcode,
      addressCountry: (site as unknown as typeof SITE).address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: (site as unknown as typeof SITE).geo.lat, longitude: (site as unknown as typeof SITE).geo.lng },
    hasMap: (site as unknown as typeof SITE).googleMapsUrl,
    openingHoursSpecification,
    // Human-readable openingHours for older parsers + SEO snippets
    openingHours: ["Tu-Sa 12:00-21:00"],
    areaServed: (site as unknown as typeof SITE).areaServed.map((area: string) => ({ "@type": "City", name: area })),
    sameAs: [(site as unknown as typeof SITE).googleMapsUrl, (site as unknown as typeof SITE).deliverooUrl],
    // Bring-your-own-alcohol, family-friendly, dine-in + takeaway
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Bring your own alcohol (BYOB) – corkage applies", value: true },
      { "@type": "LocationFeatureSpecification", name: "Family-friendly dining", value: true },
      { "@type": "LocationFeatureSpecification", name: "Takeaway collection", value: true },
      { "@type": "LocationFeatureSpecification", name: "Dine-in", value: true },
      { "@type": "LocationFeatureSpecification", name: "Delivery via Deliveroo", value: true },
    ],
    knowsAbout: [
      "Thai cuisine",
      "Thai takeaway East Molesey",
      "Thai restaurant Hampton Court",
      "Authentic Thai curries",
      "Pad Thai",
    ],
    potentialAction: [
      {
        "@type": "OrderAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${site.url}/order`,
          inLanguage: "en-GB",
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
      },
      {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${site.url}/book`,
          inLanguage: "en-GB",
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        result: { "@type": "FoodEstablishmentReservation", name: "Table booking at Thai Courtyard" },
      },
    ],
  };
}

export function websiteJsonLd(cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: (site as unknown as typeof SITE).fullName,
    alternateName: site.name,
    description: site.description,
    inLanguage: "en-GB",
    publisher: { "@id": `${site.url}/#restaurant` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/menu?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd(cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: `${site.url}${IMG.logo.src}`,
    image: `${site.url}${IMG.logo.src}`,
    telephone: (site as unknown as typeof SITE).phoneIntl,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: (site as unknown as typeof SITE).address.street,
      addressLocality: (site as unknown as typeof SITE).address.locality,
      addressRegion: (site as unknown as typeof SITE).address.region,
      postalCode: (site as unknown as typeof SITE).address.postcode,
      addressCountry: (site as unknown as typeof SITE).address.country,
    },
    sameAs: [(site as unknown as typeof SITE).googleMapsUrl, (site as unknown as typeof SITE).deliverooUrl],
  };
}

export function menuJsonLd(menu: MenuCategory[], cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${site.name} Menu`,
    url: `${site.url}/menu`,
    inLanguage: "en-GB",
    mainEntityOfPage: `${site.url}/menu`,
    hasMenuSection: menu.map((c) => ({
      "@type": "MenuSection",
      name: c.name,
      ...(c.description ? { description: c.description } : {}),
      hasMenuItem: c.items.map((i) => {
        const diet = i.dietary.includes("vegan")
          ? "https://schema.org/VeganDiet"
          : i.dietary.includes("vegetarian")
            ? "https://schema.org/VegetarianDiet"
            : i.dietary.includes("gluten_free")
              ? "https://schema.org/GlutenFreeDiet"
              : null;
        return {
          "@type": "MenuItem",
          name: i.name,
          ...(i.description ? { description: i.description } : {}),
          offers: { "@type": "Offer", price: (i.pricePence / 100).toFixed(2), priceCurrency: "GBP", availability: i.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
          ...(diet ? { suitableForDiet: diet } : {}),
        };
      }),
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[], cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${site.url}/#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function offersJsonLd(
  offers: { id: number; title: string; description: string; ctaText: string; ctaLink: string; startsOn: string; endsOn: string }[],
  cfg?: RestaurantConfig | null,
) {
  const site = resolveSite(cfg);
  if (!offers.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Thai Courtyard Offers",
    itemListElement: offers.map((offer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Offer",
        name: offer.title,
        description: offer.description,
        url: offer.ctaLink.startsWith("http") ? offer.ctaLink : `${site.url}${offer.ctaLink}`,
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
        validFrom: offer.startsOn,
        validThrough: offer.endsOn,
        seller: { "@id": `${site.url}/#restaurant` },
      },
    })),
  };
}

// -- Shared SEO helpers ------------------------------------------------------

export const DEFAULT_OG_IMAGE = "/images/hero-spread.jpg";

export function absoluteUrl(path: string, cfg?: RestaurantConfig | null) {
  const site = resolveSite(cfg);
  if (!path) return site.url;
  if (path.startsWith("http")) return path;
  return `${site.url}${path.startsWith("/") ? path : `/${path}`}`;
}

// Canonical + open graph defaults for any page
export function pageSeoDefaults(path: string, overrides?: { title?: string | null; description?: string | null; ogImage?: string | null }, cfg?: RestaurantConfig | null) {
  const abs = absoluteUrl(path, cfg);
  const ogImage = overrides?.ogImage ? absoluteUrl(overrides.ogImage, cfg) : absoluteUrl(DEFAULT_OG_IMAGE, cfg);
  return {
    canonical: abs,
    ogImage,
    twitterImage: ogImage,
  };
}
