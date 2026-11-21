import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getRestaurantConfig } from "@/lib/restaurant";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cfg = await getRestaurantConfig().catch(() => null);
  return {
    name: cfg?.fullName || SITE.fullName,
    short_name: cfg?.restaurantName || SITE.name,
    description: cfg?.shortDescription || SITE.shortDescription,
    start_url: "/",
    display: "standalone",
    scope: "/",
    background_color: "#1d1b1a",
    theme_color: "#1d1b1a",
    orientation: "portrait-primary",
    categories: ["food", "restaurant", "food_delivery"],
    lang: "en-GB",
    dir: "ltr",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "View Menu", url: "/menu", description: "Browse our authentic Thai menu" },
      { name: "Order Collection", url: "/order", description: "Order Thai takeaway for collection" },
      { name: "Book a Table", url: "/book", description: "Reserve a table at Thai Courtyard" },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}
