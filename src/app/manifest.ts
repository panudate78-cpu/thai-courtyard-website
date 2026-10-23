import type { MetadataRoute } from "next";
import { getRestaurantConfigSafe } from "@/lib/restaurant";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await getRestaurantConfigSafe();
  return {
    name: config.fullName,
    short_name: config.name,
    description: config.description,
    start_url: "/",
    display: "standalone",
    background_color: "#1d1b1a",
    theme_color: "#1d1b1a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: config.logoUrl, sizes: "512x512", type: "image/png" },
    ],
  };
}
