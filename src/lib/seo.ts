import { DAY_NAMES } from "./site";
import type { RestaurantConfig } from "./restaurant";
import type { MenuCategory } from "./types";

export function restaurantJsonLd(config: RestaurantConfig) {
  const openingHoursSpecification = [0, 1, 2, 3, 4, 5, 6]
    .filter((d) => config.openingHours[d])
    .map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[d]}`,
      opens: config.openingHours[d]!.open,
      closes: config.openingHours[d]!.close,
    }));

  const sameAs = [config.googleMapsUrl, config.social.facebook, config.social.instagram, config.social.tripadvisor, config.delivery.url].filter(
    Boolean,
  );

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${config.url}/#restaurant`,
    name: config.name,
    alternateName: config.fullName,
    ...(config.tagline ? { slogan: config.tagline } : {}),
    description: config.description,
    url: config.url,
    telephone: config.phoneIntl,
    ...(config.email ? { email: config.email } : {}),
    image: [config.heroImageUrl, config.aboutImageUrl].filter(Boolean).map((src) => (src.startsWith("http") ? src : `${config.url}${src}`)),
    logo: config.logoUrl.startsWith("http") || config.logoUrl.startsWith("data:") ? config.logoUrl : `${config.url}${config.logoUrl}`,
    ...(config.cuisine ? { servesCuisine: [config.cuisine] } : {}),
    priceRange: "££",
    currenciesAccepted: config.currency,
    paymentAccepted: "Cash, Credit Card, Debit Card",
    acceptsReservations: `${config.url}/book`,
    hasMenu: `${config.url}/menu`,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.address.street,
      addressLocality: config.address.locality,
      ...(config.address.region ? { addressRegion: config.address.region } : {}),
      postalCode: config.address.postcode,
      addressCountry: config.address.country,
    },
    ...(config.geo ? { geo: { "@type": "GeoCoordinates", latitude: config.geo.lat, longitude: config.geo.lng } } : {}),
    hasMap: config.googleMapsUrl,
    openingHoursSpecification,
    sameAs,
    potentialAction: [
      {
        "@type": "OrderAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${config.url}/order`,
          inLanguage: config.locale,
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp",
      },
      {
        "@type": "ReserveAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${config.url}/book`,
          inLanguage: config.locale,
          actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
        },
        result: { "@type": "FoodEstablishmentReservation", name: `Table booking at ${config.name}` },
      },
    ],
  };
}

export function menuJsonLd(menu: MenuCategory[], config: RestaurantConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    name: `${config.name} Menu`,
    url: `${config.url}/menu`,
    inLanguage: config.locale,
    mainEntityOfPage: `${config.url}/menu`,
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
          offers: { "@type": "Offer", price: (i.pricePence / 100).toFixed(2), priceCurrency: config.currency },
          ...(diet ? { suitableForDiet: diet } : {}),
        };
      }),
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], config: RestaurantConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${config.url}${item.path}`,
    })),
  };
}

/** Per-page metadata helpers driven by the restaurant profile. */
export function pageDescription(config: RestaurantConfig, fallback: string) {
  return config.description || fallback;
}
