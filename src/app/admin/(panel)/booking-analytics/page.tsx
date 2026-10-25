import type { Metadata } from "next";
import Link from "next/link";
import { getBookingDashboard } from "@/lib/business/analytics";
import { ColumnChart, RankBars } from "@/components/admin/business/charts";
import { MetricGrid, OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Booking analytics" };
export const dynamic = "force-dynamic";

export default async function BookingAnalyticsPage() {
  const bookings = await getBookingDashboard();
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Booking analytics"
        description="Demand from website table requests. Confirming and declining guests still happens on the bookings desk."
        actions={
          <Link href="/admin/bookings" className="adm-btn">
            Open bookings desk
          </Link>
        }
      />
      <OriginBanner
        origin={bookings.origin}
        warning={bookings.warning}
        note="Charts and totals are calculated from stored booking requests. Declined and cancelled requests are excluded from demand charts."
      />
      <MetricGrid metrics={bookings.metrics} />
      <Panel title="Average party size" description={bookings.partyHint}>
        <p className="font-serif text-5xl font-semibold text-charcoal">{bookings.averagePartySize}</p>
        <p className="mt-1 text-sm text-black/50">guests</p>
      </Panel>
      <Panel title="Daily bookings" description="Booking date for the current month.">
        <ColumnChart points={bookings.daily} label="Daily bookings" format={(value) => String(Math.round(value))} />
      </Panel>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Weekly bookings" description="Last eight weeks, Monday to Sunday.">
          <ColumnChart points={bookings.weekly} label="Weekly bookings" format={(value) => String(Math.round(value))} />
        </Panel>
        <Panel title="Monthly bookings" description="Last twelve months.">
          <ColumnChart points={bookings.monthly} label="Monthly bookings" format={(value) => String(Math.round(value))} />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Most popular booking times">
          <RankBars rows={bookings.times} />
        </Panel>
        <Panel title="Busiest days">
          <RankBars rows={bookings.days} />
        </Panel>
      </div>
    </div>
  );
}
