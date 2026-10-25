import type { Metadata } from "next";
import { ColumnChart } from "@/components/admin/business/charts";
import { ReportDateFilter } from "@/components/admin/business/ReportDateFilter";
import { DataTable, ExportLinks, MetricGrid, PageIntro, Panel } from "@/components/admin/business/widgets";
import { formatPrice } from "@/lib/format";
import { getLiveBusinessReport, resolveReportRange } from "@/lib/business/reports-live";
import type { Metric } from "@/lib/business/types";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string; start?: string; end?: string }> }) {
  const params = await searchParams;
  const selection = resolveReportRange(params);
  let report: Awaited<ReturnType<typeof getLiveBusinessReport>> | null = null;
  let unavailable = false;
  try {
    report = await getLiveBusinessReport(params);
  } catch (error) {
    console.error("[reports] live report query failed", error);
    unavailable = true;
  }
  const dates = report ?? { ...selection, trends: [], enquiries: 0, customers: 0, jobs: 0, completedJobs: 0, revenuePence: 0, averageJobValuePence: null, conversionRate: null, hasData: false };
  const dateLabel = `${dates.start} – ${dates.end}`;
  const metrics: Metric[] = [
    { label: "Total enquiries", value: String(dates.enquiries), hint: "Contact requests received", origin: "live" },
    { label: "Total customers", value: String(dates.customers), hint: "Distinct phone numbers in orders and bookings", origin: "live" },
    { label: "Total bookings / jobs", value: String(dates.jobs), hint: "Non-cancelled orders and bookings", origin: "live" },
    { label: "Completed jobs", value: String(dates.completedJobs), hint: "Collected orders and completed bookings", origin: "live" },
    { label: "Revenue", value: formatPrice(dates.revenuePence), hint: "Non-cancelled collection orders", origin: "live" },
    { label: "Average job value", value: dates.averageJobValuePence === null ? "No data available" : formatPrice(dates.averageJobValuePence), hint: "Revenue per non-cancelled collection order", origin: "live" },
    { label: "Conversion rate", value: dates.conversionRate === null ? "No data available" : `${dates.conversionRate.toFixed(1)}%`, hint: "Completed jobs ÷ total bookings / jobs", origin: "live" },
  ];
  const query = new URLSearchParams({ range: dates.range, start: dates.start, end: dates.end }).toString();
  const monthLabel = (value: string) => new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
  const monthly = dates.trends.map((row) => ({ label: monthLabel(row.month), value: row.revenuePence, title: `${row.month}: ${formatPrice(row.revenuePence)} revenue` }));
  const jobMonthly = dates.trends.map((row) => ({ label: monthLabel(row.month), value: row.jobs, title: `${row.month}: ${row.jobs} bookings / jobs` }));

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Reports"
        description={`Live business performance from saved database records · ${dateLabel}.`}
        actions={<ReportDateFilter range={dates.range} start={dates.start} end={dates.end} />}
      />
      {unavailable ? (
        <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-950 ring-1 ring-amber-200" role="status">
          <p className="font-semibold">No data available</p>
          <p className="mt-1">The database report could not be loaded. Please try again when the database is available.</p>
        </div>
      ) : dates.hasData ? (
        <>
          <MetricGrid metrics={metrics} />
          <Panel title="Monthly trends" description={`Real enquiries, jobs and collection-order revenue within ${dateLabel}.`} action={<ExportLinks hrefBase={`/api/admin/reports/business?${query}`} />}>
            <div className="grid gap-6 lg:grid-cols-2">
              {monthly.some((point) => point.value > 0) ? <div><h3 className="mb-2 text-sm font-semibold">Revenue</h3><ColumnChart points={monthly} label="Monthly revenue from collection orders" format={(value) => `£${Math.round(value / 100)}`} /></div> : null}
              {jobMonthly.some((point) => point.value > 0) ? <div><h3 className="mb-2 text-sm font-semibold">Bookings / jobs</h3><ColumnChart points={jobMonthly} label="Monthly bookings and jobs" format={(value) => String(Math.round(value))} /></div> : null}
            </div>
            <div className="mt-5">
              <DataTable columns={["Month", "Enquiries", "Customers", "Bookings / jobs", "Completed", "Revenue"]} rows={dates.trends.map((row) => [row.month, String(row.enquiries), String(row.customers), String(row.jobs), String(row.completedJobs), formatPrice(row.revenuePence)])} />
            </div>
            <p className="mt-3 text-xs text-black/45">Conversion rate is completed jobs divided by total non-cancelled bookings and orders. Average job value uses non-cancelled collection orders because table bookings do not have stored revenue.</p>
          </Panel>
        </>
      ) : (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5" role="status">
          <h2 className="text-lg font-semibold">No data available</h2>
          <p className="mt-2 text-sm text-black/55">There are no enquiries, customer records, bookings, or orders in this date range.</p>
        </div>
      )}
    </div>
  );
}
