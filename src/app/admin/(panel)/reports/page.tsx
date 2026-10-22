import type { Metadata } from "next";
import { getReport } from "@/lib/business/analytics";
import { clampPeriod, currentPeriod, formatMonthLabel } from "@/lib/business/dates";
import { PeriodSelect } from "@/components/admin/business/PeriodSelect";
import { DataTable, ExportLinks, OriginBanner, PageIntro, Panel } from "@/components/admin/business/widgets";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const { month, year } = clampPeriod(params.year, params.month);
  const now = currentPeriod();
  const query = `month=${month}&year=${year}`;
  const [sales, bookings, customers] = await Promise.all([
    getReport("sales", month, year),
    getReport("bookings", month, year),
    getReport("customers", month, year),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Business"
        title="Reports"
        description="Download the same figures shown in the dashboard. CSV opens in a spreadsheet. PDF is a plain text report for printing or emailing the team."
        actions={<PeriodSelect month={month} year={year} path="/admin/reports" currentYear={now.year} />}
      />
      <OriginBanner
        origin="mixed"
        note="Each file is labelled live or sample in the first rows. Customer exports can contain phone numbers and emails — keep them on a trusted device."
      />
      <ReportCard
        title="Sales report"
        description={`${formatMonthLabel(year, month)} daily collection totals.`}
        href={`/api/admin/reports/sales?${query}`}
        columns={sales?.columns ?? []}
        rows={(sales?.rows ?? []).slice(0, 8)}
        origin={sales?.origin}
      />
      <ReportCard
        title="Booking report"
        description={`Website booking requests dated in ${formatMonthLabel(year, month)}.`}
        href={`/api/admin/reports/bookings?${query}`}
        columns={bookings?.columns ?? []}
        rows={(bookings?.rows ?? []).slice(0, 8)}
        origin={bookings?.origin}
      />
      <ReportCard
        title="Customer report"
        description="Lifetime customer list for the selected source. The month filter does not cut this file down."
        href={`/api/admin/reports/customers?${query}`}
        columns={customers?.columns ?? []}
        rows={(customers?.rows ?? []).slice(0, 8)}
        origin={customers?.origin}
      />
    </div>
  );
}

function ReportCard({
  title,
  description,
  href,
  columns,
  rows,
  origin,
}: {
  title: string;
  description: string;
  href: string;
  columns: string[];
  rows: string[][];
  origin?: "live" | "sample";
}) {
  return (
    <Panel
      title={title}
      description={description}
      action={<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${origin === "live" ? "bg-emerald-50 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{origin === "live" ? "Live" : "Sample"}</span>}
    >
      <ExportLinks hrefBase={href} />
      <div className="mt-4">
        <DataTable columns={columns} rows={rows} />
      </div>
      <p className="mt-2 text-xs text-black/45">Preview shows the first rows. The download includes the full report.</p>
    </Panel>
  );
}
