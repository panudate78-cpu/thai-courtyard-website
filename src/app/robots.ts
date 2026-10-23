import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/order/confirmation/", "/setup"] }],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
