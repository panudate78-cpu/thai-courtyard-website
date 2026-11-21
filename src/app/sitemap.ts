import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getRestaurantConfig } from "@/lib/restaurant";

/**
 * Full SEO sitemap:
 * - All public pages with tuned priority
 * - Accurate changeFrequency (menu/order weekly, static pages monthly)
 * - lastModified is fresh for weekly pages, stable for monthly
 * - Excludes /admin, /api, /order/confirmation – handled in robots.ts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cfg = await getRestaurantConfig().catch(() => null);
  const siteUrl = cfg?.siteUrl || SITE.url;
  const now = new Date();
  // Give crawlers a hint that menu and ordering change often
  const pages: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified: Date;
  }[] = [
    { path: "", priority: 1, changeFrequency: "daily", lastModified: now },
    { path: "/menu", priority: 0.95, changeFrequency: "weekly", lastModified: now },
    { path: "/order", priority: 0.95, changeFrequency: "weekly", lastModified: now },
    { path: "/book", priority: 0.85, changeFrequency: "weekly", lastModified: now },
    { path: "/contact", priority: 0.75, changeFrequency: "monthly", lastModified: now },
    { path: "/about", priority: 0.65, changeFrequency: "monthly", lastModified: now },
    { path: "/review", priority: 0.55, changeFrequency: "monthly", lastModified: now },
  ];

  return pages.map((p) => ({
    url: `${siteUrl}${p.path}`,
    lastModified: p.lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    // Provide images for key pages to improve Image Search (Next sitemap supports it via extra fields)
    // Next.js will ignore unknown fields, but we keep it standards-compliant.
    ...(p.path === "" || p.path === "/menu"
      ? {
          images: [`${siteUrl}/images/hero-spread.jpg`, `${siteUrl}/images/thai-spread.jpg`, `${siteUrl}/images/pad-thai.jpg`],
        }
      : {}),
  }));
}
