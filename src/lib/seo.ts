import { IMG } from "./image-manifest";
import { DAY_NAMES, OPENING_HOURS, SITE } from "./site";
import type { MenuCategory } from "./types";

// -- Core JSON-LD builders ----------------------------------------------------

export function restaurantJsonLd() {
  const openingHoursSpecification = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => OPENING_HOURS[d])
    .map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[d]}`,
      opens: OPENING_HOURS[d]!.open,
      closes: OPENING_HOURS[d]!.close,
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${SITE.url}/#restaurant`,
    name: SITE.name,
    alternateName: SITE.fullName,
    slogan: "Simply Delicious",
    description: SITE.description,
    url: SITE.url,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    image: [
      IMG.heroSpread.src,
      IMG.thaiSpread.src,
      IMG.greenCurry.src,
      IMG.padThai.src,
      IMG.satay.src,
    ].map((src) => `${SITE.url}${src}`),
    logo: `${SITE.url}${IMG.logo.src}`,
    servesCuisine: [...SITE.servesCuisine],
    priceRange: SITE.priceRange,
    currenciesAccepted: SITE.currenciesAccepted,
    paymentAccepted: SITE.paymentAccepted,
    acceptsReservations: `${SITE.url}/book`,
    hasMenu: `${SITE.url}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postcode,
      addressCountry: SITE.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    hasMap: SITE.googleMapsUrl,
    openingHoursSpecification,
    // Human-readable openingHours for older parsers + SEO snippets
    openingHours: ["Tu-Sa 12:00-21:00"],
    areaServed: SITE.areaServed.map((area) => ({ "@type": "City", name: area })),
    sameAs: [SITE.googleMapsUrl, SITE.deliverooUrl],
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
          urlTemplate: `${SITE.url}/order`,
          inLanguage: "en-GB",
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
      },
      {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE.url}/book`,
          inLanguage: "en-GB",
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        result: { "@type": "FoodEstablishmentReservation", name: "Table booking at Thai Courtyard" },
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.fullName,
    alternateName: SITE.name,
    description: SITE.description,
    inLanguage: "en-GB",
    publisher: { "@id": `${SITE.url}/#restaurant` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/menu?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}${IMG.logo.src}`,
    image: `${SITE.url}${IMG.logo.src}`,
    telephone: SITE.phoneIntl,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.locality,
      addressRegion: SITE.address.region,
      postalCode: SITE.address.postcode,
      addressCountry: SITE.address.country,
    },
    sameAs: [SITE.googleMapsUrl, SITE.deliverooUrl],
  };
}

export function menuJsonLd(menu: MenuCategory[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: "Thai Courtyard Menu",
    url: `${SITE.url}/menu`,
    inLanguage: "en-GB",
    mainEntityOfPage: `${SITE.url}/menu`,
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

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}/#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function offersJsonLd(
  offers: { id: number; title: string; description: string; ctaText: string; ctaLink: string; startsOn: string; endsOn: string }[],
) {
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
        url: offer.ctaLink.startsWith("http") ? offer.ctaLink : `${SITE.url}${offer.ctaLink}`,
        priceCurrency: "GBP",
        availability: "https://schema.org/InStock",
        validFrom: offer.startsOn,
        validThrough: offer.endsOn,
        seller: { "@id": `${SITE.url}/#restaurant` },
      },
    })),
  };
}

// -- Shared SEO helpers ------------------------------------------------------

export const DEFAULT_OG_IMAGE = "/images/hero-spread.jpg";

export function absoluteUrl(path: string) {
  if (!path) return SITE.url;
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}

// Canonical + open graph defaults for any page
export function pageSeoDefaults(path: string, overrides?: { title?: string | null; description?: string | null; ogImage?: string | null }) {
  const abs = absoluteUrl(path);
  const ogImage = overrides?.ogImage ? absoluteUrl(overrides.ogImage) : absoluteUrl(DEFAULT_OG_IMAGE);
  return {
    canonical: abs,
    ogImage,
    twitterImage: ogImage,
  };
}
