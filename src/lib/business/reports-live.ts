import { addDays, isValidDateString, londonNow } from "@/lib/hours";
import { pool } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";

export type ReportRange = "today" | "7d" | "30d" | "12m" | "custom";
export type MonthlyBusinessTrend = { month: string; enquiries: number; customers: number; jobs: number; completedJobs: number; revenuePence: number };
export type LiveBusinessReport = {
  range: ReportRange;
  start: string;
  end: string;
  enquiries: number;
  customers: number;
  jobs: number;
  completedJobs: number;
  revenuePence: number;
  averageJobValuePence: number | null;
  conversionRate: number | null;
  trends: MonthlyBusinessTrend[];
  hasData: boolean;
};

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolveReportRange(params: { range?: string; start?: string; end?: string }) {
  const today = londonNow().date;
  const range: ReportRange = ["today", "7d", "30d", "12m", "custom"].includes(params.range ?? "") ? params.range as ReportRange : "30d";
  let start = addDays(today, -29);
  let end = today;
  if (range === "today") start = today;
  if (range === "7d") start = addDays(today, -6);
  if (range === "12m") start = addDays(today, -364);
  if (range === "custom" && isValidDateString(params.start ?? "") && isValidDateString(params.end ?? "") && params.start! <= params.end!) {
    start = params.start!;
    end = params.end! > today ? today : params.end!;
    if (start > end) start = end;
  }
  return { range, start, end };
}

function monthKeys(start: string, end: string) {
  const keys: string[] = [];
  let date = `${start.slice(0, 7)}-01`;
  const final = `${end.slice(0, 7)}-01`;
  while (date <= final && keys.length < 61) {
    keys.push(date.slice(0, 7));
    date = addDays(date, 32).slice(0, 7) + "-01";
  }
  return keys;
}

export async function getLiveBusinessReport(rangeInput: { range?: string; start?: string; end?: string }): Promise<LiveBusinessReport> {
  await ensureDatabase();
  const { range, start, end } = resolveReportRange(rangeInput);
  const [orderResult, bookingResult, enquiryResult, customerSummary, customerMonthResult] = await Promise.all([
    pool.query<{ month_key: string; jobs: number; completed_jobs: number; revenue_pence: number }>(
      `select substr(collection_date, 1, 7) as month_key,
              count(*) filter (where status <> 'cancelled')::int as jobs,
              count(*) filter (where status = 'collected')::int as completed_jobs,
              coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as revenue_pence
       from orders
       where collection_date >= $1 and collection_date <= $2
       group by 1`,
      [start, end],
    ),
    pool.query<{ month_key: string; jobs: number; completed_jobs: number }>(
      `select substr(date, 1, 7) as month_key,
              count(*) filter (where status not in ('cancelled', 'declined'))::int as jobs,
              count(*) filter (where status = 'completed')::int as completed_jobs
       from bookings
       where date >= $1 and date <= $2
       group by 1`,
      [start, end],
    ),
    pool.query<{ month_key: string; enquiries: number }>(
      `select to_char(date_trunc('month', created_at at time zone 'Europe/London'), 'YYYY-MM') as month_key,
              count(*)::int as enquiries
       from contact_messages
       where (created_at at time zone 'Europe/London')::date >= $1::date
         and (created_at at time zone 'Europe/London')::date <= $2::date
       group by 1`,
      [start, end],
    ),
    pool.query<{ customers: number }>(
      `select count(*)::int as customers
       from (
         select regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from orders
         where collection_date >= $1 and collection_date <= $2 and status <> 'cancelled'
         union
         select regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from bookings
         where date >= $1 and date <= $2 and status not in ('cancelled', 'declined')
       ) as all_customers
       where phone <> ''`,
      [start, end],
    ),
    pool.query<{ month_key: string; customers: number }>(
      `select month_key, count(*)::int as customers
       from (
         select substr(collection_date, 1, 7) as month_key,
                regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from orders
         where collection_date >= $1 and collection_date <= $2 and status <> 'cancelled'
         union
         select substr(date, 1, 7) as month_key,
                regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from bookings
         where date >= $1 and date <= $2 and status not in ('cancelled', 'declined')
       ) as customers_by_month
       where phone <> ''
       group by month_key`,
      [start, end],
    ),
  ]);

  const byMonth = new Map<string, MonthlyBusinessTrend>();
  for (const month of monthKeys(start, end)) byMonth.set(month, { month, enquiries: 0, customers: 0, jobs: 0, completedJobs: 0, revenuePence: 0 });
  for (const row of orderResult.rows) {
    const value = byMonth.get(row.month_key);
    if (!value) continue;
    value.jobs += number(row.jobs);
    value.completedJobs += number(row.completed_jobs);
    value.revenuePence += number(row.revenue_pence);
  }
  for (const row of bookingResult.rows) {
    const value = byMonth.get(row.month_key);
    if (!value) continue;
    value.jobs += number(row.jobs);
    value.completedJobs += number(row.completed_jobs);
  }
  for (const row of enquiryResult.rows) {
    const value = byMonth.get(row.month_key);
    if (value) value.enquiries = number(row.enquiries);
  }
  for (const row of customerMonthResult.rows) {
    const value = byMonth.get(row.month_key);
    if (value) value.customers = number(row.customers);
  }

  const trends = [...byMonth.values()];
  const enquiries = trends.reduce((total, row) => total + row.enquiries, 0);
  const jobs = trends.reduce((total, row) => total + row.jobs, 0);
  const completedJobs = trends.reduce((total, row) => total + row.completedJobs, 0);
  const revenuePence = trends.reduce((total, row) => total + row.revenuePence, 0);
  const customers = number(customerSummary.rows[0]?.customers);
  const orderCount = orderResult.rows.reduce((total, row) => total + number(row.jobs), 0);
  return {
    range, start, end, enquiries, customers, jobs, completedJobs, revenuePence,
    averageJobValuePence: orderCount ? Math.round(revenuePence / orderCount) : null,
    conversionRate: jobs ? (completedJobs / jobs) * 100 : null,
    trends,
    hasData: enquiries + customers + jobs + revenuePence > 0,
  };
}
