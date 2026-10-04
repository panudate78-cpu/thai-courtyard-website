import { IMG } from "./image-manifest";
import { DAY_NAMES, OPENING_HOURS, SITE } from "./site";
import type { MenuCategory } from "./types";

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
    image: [IMG.heroSpread.src, IMG.thaiSpread.src, IMG.greenCurry.src].map((src) => `${SITE.url}${src}`),
    logo: `${SITE.url}${IMG.logo.src}`,
    servesCuisine: ["Thai", "Asian"],
    priceRange: "££",
    currenciesAccepted: "GBP",
    paymentAccepted: "Cash, Credit Card, Debit Card",
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
    sameAs: [SITE.googleMapsUrl, SITE.deliverooUrl],
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
          offers: { "@type": "Offer", price: (i.pricePence / 100).toFixed(2), priceCurrency: "GBP" },
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
