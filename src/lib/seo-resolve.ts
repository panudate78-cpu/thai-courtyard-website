import { getSeoEditor, LIVE_SEO_PAGES } from "./business/seo";

export type ResolvedSeo = {
  path: string;
  label: string;
  title: string;
  description: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasOverride: boolean;
  structuredData: string[];
};

export async function getResolvedSeo(path: string): Promise<ResolvedSeo | null> {
  const live = LIVE_SEO_PAGES.find((p) => p.path === path);
  if (!live) return null;
  try {
    const editor = await getSeoEditor();
    const override = editor.pages.find((p) => p.path === path);
    if (!override || !override.hasOverride) {
      return {
        path: live.path,
        label: live.label,
        title: live.metaTitle,
        description: live.metaDescription,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        hasOverride: false,
        structuredData: live.structuredData,
      };
    }
    return {
      path: live.path,
      label: live.label,
      title: override.metaTitle || live.metaTitle,
      description: override.metaDescription || live.metaDescription,
      ogTitle: override.ogTitle || null,
      ogDescription: override.ogDescription || null,
      ogImage: override.ogImage || null,
      hasOverride: true,
      structuredData: live.structuredData,
    };
  } catch {
    return {
      path: live.path,
      label: live.label,
      title: live.metaTitle,
      description: live.metaDescription,
      ogTitle: null,
      ogDescription: null,
      ogImage: null,
      hasOverride: false,
      structuredData: live.structuredData,
    };
  }
}

export async function resolveAllSeo(): Promise<ResolvedSeo[]> {
  const results: ResolvedSeo[] = [];
  for (const page of LIVE_SEO_PAGES) {
    const r = await getResolvedSeo(page.path);
    if (r) results.push(r);
  }
  return results;
}
