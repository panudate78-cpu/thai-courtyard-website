import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getRestaurantConfig } from "@/lib/restaurant";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const cfg = await getRestaurantConfig().catch(() => null);
  const siteUrl = cfg?.siteUrl || SITE.url;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/order/confirmation/", "/*?*utm_*", "/_next/"],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
