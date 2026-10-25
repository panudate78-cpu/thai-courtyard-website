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
  const summaryResult = await pool.query<{
    enquiries: number;
    customers: number;
    jobs: number;
    completed_jobs: number;
    revenue_pence: number;
    completed_orders: number;
  }>(
    `with order_rows as (
       select id, phone, collection_date as event_date, status, subtotal_pence
       from orders
       where collection_date >= $1 and collection_date <= $2
     ), booking_rows as (
       select id, phone, date as event_date, status
       from bookings
       where date >= $1 and date <= $2
     ), customer_phones as (
       select regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone from order_rows where status <> 'cancelled'
       union all
       select regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone from booking_rows where status not in ('cancelled', 'declined')
     )
     select (select count(*)::int from contact_messages
             where (created_at at time zone 'Europe/London')::date between $1::date and $2::date) as enquiries,
            (select count(distinct phone) filter (where phone <> '')::int from customer_phones) as customers,
            ((select count(*) from order_rows where status <> 'cancelled') +
             (select count(*) from booking_rows where status not in ('cancelled', 'declined')))::int as jobs,
            ((select count(*) from order_rows where status = 'collected') +
             (select count(*) from booking_rows where status = 'completed'))::int as completed_jobs,
            coalesce((select sum(subtotal_pence) from order_rows where status = 'collected'), 0)::int as revenue_pence,
            (select count(*) from order_rows where status = 'collected')::int as completed_orders`,
    [start, end],
  );
  const summary = summaryResult.rows[0];

  const [trendRows, bookingTrendRows, enquiryTrendRows, customerTrendRows] = await Promise.all([
    pool.query<{ month: string; jobs: number; completed_jobs: number; revenue_pence: number }>(
      `select substr(event_date, 1, 7) as month,
              count(*) filter (where status <> 'cancelled')::int as jobs,
              count(*) filter (where status = 'collected')::int as completed_jobs,
              coalesce(sum(subtotal_pence) filter (where status = 'collected'), 0)::int as revenue_pence
       from orders where event_date between $1 and $2 group by 1`, [start, end]),
    pool.query<{ month: string; jobs: number; completed_jobs: number }>(
      `select substr(date, 1, 7) as month,
              count(*) filter (where status not in ('cancelled', 'declined'))::int as jobs,
              count(*) filter (where status = 'completed')::int as completed_jobs
       from bookings where date between $1 and $2 group by 1`, [start, end]),
    pool.query<{ month: string; enquiries: number }>(
      `select to_char(date_trunc('month', created_at at time zone 'Europe/London'), 'YYYY-MM') as month,
              count(*)::int as enquiries
       from contact_messages
       where (created_at at time zone 'Europe/London')::date between $1::date and $2::date
       group by 1`, [start, end]),
    pool.query<{ month: string; customers: number }>(
      `with people as (
         select substr(collection_date, 1, 7) as month, regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from orders where collection_date between $1 and $2 and status <> 'cancelled'
         union
         select substr(date, 1, 7) as month, regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') as phone
         from bookings where date between $1 and $2 and status not in ('cancelled', 'declined')
       ) select month, count(distinct phone) filter (where phone <> '')::int as customers from people group by month`, [start, end]),
  ]);
  const byMonth = new Map<string, MonthlyBusinessTrend>();
  for (const key of monthKeys(start, end)) byMonth.set(key, { month: key, enquiries: 0, customers: 0, jobs: 0, completedJobs: 0, revenuePence: 0 });
  for (const row of trendRows.rows) {
    const data = byMonth.get(row.month);
    if (data) {
      data.jobs += number(row.jobs);
      data.completedJobs += number(row.completed_jobs);
      data.revenuePence += number(row.revenue_pence);
    }
  }
  for (const row of bookingTrendRows.rows) {
    const data = byMonth.get(row.month);
    if (data) {
      data.jobs += number(row.jobs);
      data.completedJobs += number(row.completed_jobs);
    }
  }
  for (const row of enquiryTrendRows.rows) {
    const data = byMonth.get(row.month);
    if (data) data.enquiries = number(row.enquiries);
  }
  for (const row of customerTrendRows.rows) {
    const data = byMonth.get(row.month);
    if (data) data.customers = number(row.customers);
  }
  const customers = number(summary?.customers);
  const jobs = number(summary?.jobs);
  const completedJobs = number(summary?.completed_jobs);
  const revenuePence = number(summary?.revenue_pence);
  const completedOrders = number(summary?.completed_orders);
  const enquiries = number(summary?.enquiries);
  return {
    range, start, end, enquiries, customers, jobs, completedJobs, revenuePence,
    averageJobValuePence: completedOrders ? Math.round(revenuePence / completedOrders) : null,
    conversionRate: jobs ? (completedJobs / jobs) * 100 : null,
    trends: [...byMonth.values()],
    hasData: enquiries + customers + jobs + revenuePence > 0,
  };
}
