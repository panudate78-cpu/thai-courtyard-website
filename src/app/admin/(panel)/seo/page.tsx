import type { Metadata } from "next";
import { SeoForm } from "@/components/admin/business/SeoForm";
import { PageIntro, Panel } from "@/components/admin/business/widgets";
import { getSeoEditor, SITEMAP_STATUS, SOCIAL_IMAGES, STRUCTURED_DATA_STATUS } from "@/lib/business/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "SEO" };
export const dynamic = "force-dynamic";

export default async function SeoAdminPage() {
  const seo = await getSeoEditor();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="SEO"
        description="Full SEO is live. Saving an override now updates the public site immediately — titles, descriptions and social images. Use it to target keywords like “Thai takeaway Hampton Court” or promote seasonal offers."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Sitemap status" description={SITEMAP_STATUS.status}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-black/50">Address</dt>
              <dd className="font-medium">{SITE.url}{SITEMAP_STATUS.path}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-black/50">Source</dt>
              <dd>{SITEMAP_STATUS.source}</dd>
            </div>
            <div>
              <dt className="text-black/50">Included</dt>
              <dd className="mt-1">{SITEMAP_STATUS.pages.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-black/50">Excluded by robots</dt>
              <dd className="mt-1">{SITEMAP_STATUS.excluded.join(", ")}</dd>
            </div>
          </dl>
          <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 uppercase">Active</p>
        </Panel>
        <Panel title="Structured data status" description="JSON-LD already rendered by the public pages.">
          <ul className="space-y-3 text-sm">
            {STRUCTURED_DATA_STATUS.map((item) => (
              <li key={item.name} className="flex items-start justify-between gap-3 border-b border-black/5 pb-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-black/55">{item.where}</p>
                  <p className="text-xs text-black/40">{item.source}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 uppercase">{item.status}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Open Graph defaults" description="Root layout sets locale en_GB, site name and branded OG image (1200×630 generated via /opengraph-image) plus food photography fallbacks. Overrides below let you A/B test titles for Google & social.">
        <p className="text-sm text-black/60">Choose a social image override per page below. Images are limited to files already in the website gallery.</p>
      </Panel>
      <SeoForm pages={seo.pages} images={SOCIAL_IMAGES.map(({ src, alt }) => ({ src, alt }))} tablesReady={seo.tablesReady} />
    </div>
  );
}
