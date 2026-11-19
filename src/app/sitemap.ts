import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Full SEO sitemap:
 * - All public pages with tuned priority
 * - Accurate changeFrequency (menu/order weekly, static pages monthly)
 * - lastModified is fresh for weekly pages, stable for monthly
 * - Excludes /admin, /api, /order/confirmation – handled in robots.ts
 */
export default function sitemap(): MetadataRoute.Sitemap {
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
    url: `${SITE.url}${p.path}`,
    lastModified: p.lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
    // Provide images for key pages to improve Image Search (Next sitemap supports it via extra fields)
    // Next.js will ignore unknown fields, but we keep it standards-compliant.
    ...(p.path === "" || p.path === "/menu"
      ? {
          images: [`${SITE.url}/images/hero-spread.jpg`, `${SITE.url}/images/thai-spread.jpg`, `${SITE.url}/images/pad-thai.jpg`],
        }
      : {}),
  }));
}
