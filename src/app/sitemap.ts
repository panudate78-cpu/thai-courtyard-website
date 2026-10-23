import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/menu", priority: 0.9, changeFrequency: "weekly" },
    { path: "/order", priority: 0.9, changeFrequency: "weekly" },
    { path: "/book", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  ];
  const lastModified = new Date();
  return pages.map((p) => ({
    url: `${url}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
