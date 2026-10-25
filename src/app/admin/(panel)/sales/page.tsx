import type { Metadata } from "next";
import { getSalesDashboard } from "@/lib/business/analytics";
import { clampPeriod, currentPeriod, formatGrowth, formatMonthLabel } from "@/lib/business/dates";
import { money } from "@/lib/business/present";
import { ColumnChart, GroupedColumnChart, LineChart } from "@/components/admin/business/charts";
import { PeriodSelect } from "@/components/admin/business/PeriodSelect";
import { DataTable, MetricGrid, OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Sales" };
export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = clampPeriod(params.year, params.month);
  const sales = await getSalesDashboard(month, year);
  const now = currentPeriod();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Sales"
        description="Collection revenue for the month you choose. Cancelled orders are kept out of revenue and shown as the refund figure, because there is no separate refund ledger."
        actions={<PeriodSelect month={month} year={year} path="/admin/sales" currentYear={now.year} />}
      />
      <OriginBanner
        origin={sales.origin}
        warning={sales.warning}
        note={`${sales.rangeLabel}. Compared with ${sales.comparisonLabel}. All figures come from saved collection orders.`}
      />
      <MetricGrid metrics={sales.metrics} />

      <Panel
        title="Previous month comparison"
        description={sales.showFullPrevious ? `Like-for-like days, plus the full previous month for context.` : `Like-for-like with ${sales.comparisonLabel}.`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">{sales.rangeLabel}</p>
            <p className="mt-1 text-3xl font-semibold">{money(sales.currentRevenuePence)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">{sales.comparisonLabel}</p>
            <p className="mt-1 text-3xl font-semibold">{money(sales.previousRevenuePence)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-black/45 uppercase">Growth</p>
            <p className={`mt-1 text-3xl font-semibold ${sales.growthPercent != null && sales.growthPercent < 0 ? "text-chili" : "text-jade"}`}>
              {formatGrowth(sales.growthPercent)}
            </p>
          </div>
        </div>
        {sales.showFullPrevious ? (
          <p className="mt-3 text-sm text-black/55">Full {formatMonthLabel(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)} revenue was {money(sales.previousFullRevenuePence)}.</p>
        ) : null}
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-6 text-black/70">{sales.narrative}</p>
      </Panel>

      <Panel title="Daily sales" description="Gold bars are trading days. Pale bars are closed days, future dates, or days with no sales.">
        <ColumnChart points={sales.daily} label={`Daily sales for ${formatMonthLabel(year, month)}`} />
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-teak">View daily figures</summary>
          <div className="mt-3">
            <DataTable columns={sales.dailyTable.columns} rows={sales.dailyTable.rows} />
          </div>
        </details>
      </Panel>

      <Panel title="Weekly sales" description="Weeks that overlap the selected month, Monday to Sunday.">
        <ColumnChart points={sales.weekly} label="Weekly sales" />
      </Panel>

      <Panel title="Monthly revenue comparison" description={`${year} against ${year - 1}. Future months are left blank rather than forecast.`}>
        <GroupedColumnChart points={sales.monthly} label="Monthly revenue comparison" currentName={String(year)} previousName={String(year - 1)} />
      </Panel>

      <Panel title="Yearly revenue trend" description="The current year is year to date, so it is not compared as a full year.">
        <LineChart points={sales.yearly} label="Yearly revenue trend" format={(value) => money(value)} />
      </Panel>
    </div>
  );
}
