import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Full SEO sitemap:
 * - All public pages with tuned priority
 * - Accurate changeFrequency (menu/order weekly, static pages monthly)
 * - Real lastModified from DB when available (menu updatedAt), else now
 * - Excludes /admin, /api, /order/confirmation – handled in robots.ts
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let menuModified: Date | null = null;
  let homeModified: Date | null = null;
  try {
    const { pool } = await import("@/db");
    // Last menu edit is a better signal than "now" for crawlers
    const menuRes = await pool.query<{ max: string }>('select max(updated_at) as max from menu_items');
    if (menuRes.rows[0]?.max) menuModified = new Date(menuRes.rows[0].max);
    const offerRes = await pool.query<{ max: string }>('select max(updated_at) as max from offers');
    if (offerRes.rows[0]?.max) homeModified = new Date(offerRes.rows[0].max);
    // Home also reflects menu changes
    if (menuModified && homeModified) homeModified = menuModified > homeModified ? menuModified : homeModified;
    else if (menuModified) homeModified = menuModified;
  } catch {
    // fallback to now on build without DB
  }
  const now = new Date();
  const pages: {
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified: Date;
  }[] = [
    { path: "", priority: 1, changeFrequency: "daily", lastModified: homeModified ?? now },
    { path: "/menu", priority: 0.95, changeFrequency: "weekly", lastModified: menuModified ?? now },
    { path: "/order", priority: 0.95, changeFrequency: "weekly", lastModified: menuModified ?? now },
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
    ...(p.path === "" || p.path === "/menu"
      ? {
          images: [`${SITE.url}/images/hero-spread.jpg`, `${SITE.url}/images/thai-spread.jpg`, `${SITE.url}/images/pad-thai.jpg`],
        }
      : {}),
  }));
}
