import type { Metadata } from "next";
import { Star } from "lucide-react";
import { getMarketingDashboard } from "@/lib/business/analytics";
import { ColumnChart, RankBars } from "@/components/admin/business/charts";
import { DataTable, OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Marketing" };
export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const marketing = await getMarketingDashboard();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Marketing"
        description="Vouchers, referrals and Google reviews are not stored in the database yet. This page is the framework, filled with labelled sample figures until those sources are connected."
      />
      <OriginBanner
        origin="sample"
        note="Every number on this page is sample data. Replace getMarketingDashboard() with live voucher, referral and review queries when those tables or a Google Business connection exist."
      />

      <Panel title="Voucher usage" description="No voucher table exists yet." action={<SampleTag />}>
        <DataTable
          columns={["Code", "Offer", "Uses", "Value", "Status"]}
          rows={marketing.vouchers.map((row) => [row.code, row.offer, row.uses, row.value, row.status])}
        />
      </Panel>

      <Panel title="Promotion performance" description="Promotions are not coded against orders yet." action={<SampleTag />}>
        <div className="grid gap-3 md:grid-cols-3">
          {marketing.promotions.map((promo) => (
            <article key={promo.name} className="rounded-2xl bg-cream p-4">
              <h3 className="font-semibold">{promo.name}</h3>
              <p className="mt-1 text-sm text-black/60">{promo.detail}</p>
              <p className="mt-3 text-2xl font-semibold">{promo.redemptions}</p>
              <p className="text-xs text-black/50">redemptions · {promo.lift}</p>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Referral usage" description="How new guests say they found the restaurant. Not captured on the booking or order forms yet." action={<SampleTag />}>
          <RankBars rows={marketing.referrals} format={(value) => `${value}%`} />
        </Panel>
        <Panel title="Seasonal trends" description="Index where 100 is a typical May. Useful as a planning shape, not as cash." action={<SampleTag />}>
          <ColumnChart points={marketing.seasonal} label="Seasonal index" format={(value) => String(Math.round(value))} />
        </Panel>
      </div>

      <Panel
        title="Google reviews"
        description="The website links guests to Google, but ratings are not pulled back in. These statistics are placeholders."
        action={
          <a className="adm-btn" href={marketing.reviewUrl} target="_blank" rel="noopener noreferrer">
            Open Google reviews
          </a>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <div className="rounded-2xl bg-charcoal p-5 text-cream">
            <p className="text-xs tracking-[0.2em] text-gold-light uppercase">Sample rating</p>
            <p className="mt-2 font-serif text-5xl font-semibold text-gold-light">{marketing.reviews.average}</p>
            <div className="mt-2 flex gap-1 text-gold" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-2 text-sm text-cream/70">{marketing.reviews.count} sample reviews</p>
          </div>
          <RankBars rows={marketing.reviews.distribution} />
        </div>
        <ul className="mt-5 space-y-3">
          {marketing.reviews.recent.map((review) => (
            <li key={review.author} className="rounded-xl bg-cream p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{review.author}</p>
                <p className="text-xs text-black/50">{review.date} · {review.rating}/5 · sample</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-black/70">{review.text}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function SampleTag() {
  return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">Sample</span>;
}
