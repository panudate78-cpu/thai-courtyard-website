import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ensureBusinessTables } from "@/db/business-migration";
import { seoOverrides } from "@/db/schema";
import { ensureDatabase } from "@/db/bootstrap";
import { IMG } from "@/lib/image-manifest";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { buildLiveSeoPages, SITEMAP_STATUS, STRUCTURED_DATA_STATUS, type LiveSeoPage } from "./seo-pages";

export { SITEMAP_STATUS, STRUCTURED_DATA_STATUS };
export type { LiveSeoPage };

export const SOCIAL_IMAGES = Object.values(IMG).map((image) => ({
  src: image.src,
  alt: image.alt,
  width: image.width,
  height: image.height,
}));

const imagePaths = new Set(SOCIAL_IMAGES.map((image) => image.src));

export type SeoOverrideInput = {
  path: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
};

export type SeoPageEditor = {
  path: string;
  label: string;
  liveTitle: string;
  liveDescription: string;
  structuredData: string[];
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  hasOverride: boolean;
};

const pageSchema = z.object({
  path: z.string().refine((path) => SITEMAP_STATUS.pages.includes(path), "Unknown page"),
  metaTitle: z.string().trim().max(90),
  metaDescription: z.string().trim().max(400),
  ogTitle: z.string().trim().max(90),
  ogDescription: z.string().trim().max(400),
  ogImage: z.string().refine((value) => !value || imagePaths.has(value), "Choose an image already on the website"),
});

export const seoSaveSchema = z.object({
  pages: z.array(pageSchema).max(12),
});

export async function getSeoEditor(): Promise<{ pages: SeoPageEditor[]; tablesReady: boolean }> {
  const config = await getRestaurantConfigSafe();
  const base: SeoPageEditor[] = buildLiveSeoPages(config).map((page) => ({
    path: page.path,
    label: page.label,
    liveTitle: page.metaTitle,
    liveDescription: page.metaDescription,
    structuredData: page.structuredData,
    metaTitle: "",
    metaDescription: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    hasOverride: false,
  }));
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("[business] seo read", error);
    return { pages: base, tablesReady: false };
  }
  const tablesReady = await ensureBusinessTables();
  if (!tablesReady) return { pages: base, tablesReady: false };
  const rows = await db.select().from(seoOverrides);
  const byPath = new Map(rows.map((row) => [row.path, row]));
  return {
    tablesReady: true,
    pages: base.map((page) => {
      const row = byPath.get(page.path);
      if (!row) return page;
      const metaTitle = row.metaTitle ?? "";
      const metaDescription = row.metaDescription ?? "";
      const ogTitle = row.ogTitle ?? "";
      const ogDescription = row.ogDescription ?? "";
      const ogImage = row.ogImage ?? "";
      return {
        ...page,
        metaTitle,
        metaDescription,
        ogTitle,
        ogDescription,
        ogImage,
        hasOverride: Boolean(metaTitle || metaDescription || ogTitle || ogDescription || ogImage),
      };
    }),
  };
}

export async function saveSeoOverrides(pages: SeoOverrideInput[]) {
  await ensureDatabase();
  const ready = await ensureBusinessTables();
  if (!ready) throw new Error("The SEO table is not available yet. Run the additive migration, then try again.");
  const savedAt = new Date();
  for (const page of pages) {
    const empty = !page.metaTitle && !page.metaDescription && !page.ogTitle && !page.ogDescription && !page.ogImage;
    if (empty) {
      await db.delete(seoOverrides).where(eq(seoOverrides.path, page.path));
      continue;
    }
    await db
      .insert(seoOverrides)
      .values({
        path: page.path,
        metaTitle: page.metaTitle || null,
        metaDescription: page.metaDescription || null,
        ogTitle: page.ogTitle || null,
        ogDescription: page.ogDescription || null,
        ogImage: page.ogImage || null,
        updatedAt: savedAt,
      })
      .onConflictDoUpdate({
        target: seoOverrides.path,
        set: {
          metaTitle: page.metaTitle || null,
          metaDescription: page.metaDescription || null,
          ogTitle: page.ogTitle || null,
          ogDescription: page.ogDescription || null,
          ogImage: page.ogImage || null,
          updatedAt: savedAt,
        },
      });
  }
  return getSeoEditor();
}
