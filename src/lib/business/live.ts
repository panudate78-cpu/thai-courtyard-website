import { pool } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import type { DaySales } from "./types";

export type LiveStatus = "present" | "empty" | "unavailable";

type CountRow = { n: number };

async function query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query<T>(sql, params);
  return result.rows;
}

function num(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function databaseStatus(): Promise<{ warning?: string }> {
  try {
    await ensureDatabase();
    return {};
  } catch (error) {
    console.error("[business] database unavailable", error);
    return { warning: "The database could not be reached. No data is available." };
  }
}

export async function orderStatus(): Promise<LiveStatus> {
  try {
    await ensureDatabase();
    const [row] = await query<CountRow>("select count(*)::int as n from orders");
    return num(row?.n) > 0 ? "present" : "empty";
  } catch (error) {
    console.error("[business] order count failed", error);
    return "unavailable";
  }
}

export async function bookingStatus(): Promise<LiveStatus> {
  try {
    await ensureDatabase();
    const [row] = await query<CountRow>("select count(*)::int as n from bookings");
    return num(row?.n) > 0 ? "present" : "empty";
  } catch (error) {
    console.error("[business] booking count failed", error);
    return "unavailable";
  }
}

export async function liveDaily(start: string, end: string): Promise<DaySales[]> {
  const rows = await query<{
    date: string;
    revenue_pence: number;
    orders: number;
    customers: number;
    refund_pence: number;
  }>(
    `select collection_date as date,
            coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as revenue_pence,
            count(*) filter (where status <> 'cancelled')::int as orders,
            count(distinct regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'))
              filter (where status <> 'cancelled')::int as customers,
            coalesce(sum(subtotal_pence) filter (where status = 'cancelled'), 0)::int as refund_pence
     from orders
     where collection_date >= $1 and collection_date <= $2
     group by collection_date`,
    [start, end],
  );
  return rows.map((row) => ({
    date: row.date,
    revenuePence: num(row.revenue_pence),
    orders: num(row.orders),
    customers: num(row.customers),
    refundPence: num(row.refund_pence),
  }));
}

export async function liveDistinctCustomers(start: string, end: string) {
  const [row] = await query<CountRow>(
    `select count(distinct regexp_replace(phone, '[^0-9]', '', 'g'))::int as n
     from orders
     where status <> 'cancelled'
       and collection_date >= $1 and collection_date <= $2
       and regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') <> ''`,
    [start, end],
  );
  return num(row?.n);
}

export async function liveTotals() {
  const [row] = await query<{ orders: number; revenue_pence: number; cancelled_pence: number }>(
    `select count(*) filter (where status <> 'cancelled')::int as orders,
            coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as revenue_pence,
            coalesce(sum(subtotal_pence) filter (where status = 'cancelled'), 0)::int as cancelled_pence
     from orders`,
  );
  return {
    orders: num(row?.orders),
    revenuePence: num(row?.revenue_pence),
    cancelledPence: num(row?.cancelled_pence),
  };
}

export async function liveMonthly(start: string, end: string) {
  const rows = await query<{ year: number; month: number; revenue_pence: number; orders: number }>(
    `select extract(year from collection_date::date)::int as year,
            extract(month from collection_date::date)::int as month,
            coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as revenue_pence,
            count(*) filter (where status <> 'cancelled')::int as orders
     from orders
     where collection_date >= $1 and collection_date <= $2
     group by 1, 2`,
    [start, end],
  );
  return rows.map((row) => ({
    year: num(row.year),
    month: num(row.month),
    revenuePence: num(row.revenue_pence),
    orders: num(row.orders),
  }));
}

export type DishRow = { name: string; category: string; quantity: number; revenuePence: number };

export async function liveDishes(): Promise<DishRow[]> {
  const rows = await query<{ name: string; category: string; quantity: number; revenue_pence: number }>(
    `select oi.name,
            coalesce(mc.name, 'Uncategorised') as category,
            sum(oi.quantity)::int as quantity,
            sum(oi.line_total_pence)::int as revenue_pence
     from order_items oi
     join orders o on o.id = oi.order_id
     left join menu_items mi on mi.id = oi.menu_item_id
     left join menu_categories mc on mc.id = mi.category_id
     where o.status <> 'cancelled'
     group by oi.name, mc.name`,
  );
  return rows.map((row) => ({
    name: row.name,
    category: row.category,
    quantity: num(row.quantity),
    revenuePence: num(row.revenue_pence),
  }));
}

export async function liveUnsoldItems() {
  const rows = await query<{ name: string; category: string }>(
    `select mi.name, mc.name as category
     from menu_items mi
     join menu_categories mc on mc.id = mi.category_id
     where mi.visible = true
       and not exists (
         select 1 from order_items oi
         join orders o on o.id = oi.order_id
         where o.status <> 'cancelled' and (oi.menu_item_id = mi.id or oi.name = mi.name)
       )
     order by mc.sort_order, mi.sort_order
     limit 8`,
  );
  return rows;
}

export async function liveAddons() {
  const rows = await query<{ name: string; quantity: number; revenue_pence: number }>(
    `select opt->>'choice' as name,
            count(*)::int as quantity,
            coalesce(sum((opt->>'pricePence')::int), 0)::int as revenue_pence
     from order_items oi
     join orders o on o.id = oi.order_id
     cross join lateral jsonb_array_elements(
       case when jsonb_typeof(oi.options) = 'array' then oi.options else '[]'::jsonb end
     ) opt
     where o.status <> 'cancelled'
       and coalesce(opt->>'choice', '') <> ''
       and coalesce((opt->>'pricePence')::int, 0) > 0
     group by 1
     order by quantity desc
     limit 8`,
  );
  return rows.map((row) => ({
    name: row.name,
    quantity: num(row.quantity),
    revenuePence: num(row.revenue_pence),
  }));
}

export async function liveServiceSplit() {
  const services = await query<{ service: string; orders: number; revenue_pence: number }>(
    `select case when collection_time < '16:00' then 'lunch' else 'dinner' end as service,
            count(*)::int as orders,
            coalesce(sum(subtotal_pence), 0)::int as revenue_pence
     from orders
     where status <> 'cancelled'
     group by 1`,
  );
  const tops = await query<{ service: string; name: string; quantity: number }>(
    `select case when o.collection_time < '16:00' then 'lunch' else 'dinner' end as service,
            oi.name,
            sum(oi.quantity)::int as quantity
     from order_items oi
     join orders o on o.id = oi.order_id
     where o.status <> 'cancelled'
     group by 1, 2
     order by 1, sum(oi.quantity) desc`,
  );
  const topByService = new Map<string, string>();
  for (const row of tops) {
    if (!topByService.has(row.service)) topByService.set(row.service, row.name);
  }
  return services.map((row) => ({
    service: row.service,
    orders: num(row.orders),
    revenuePence: num(row.revenue_pence),
    top: topByService.get(row.service) ?? "—",
  }));
}

export async function liveBookingFacts(today: string) {
  const [totals] = await query<{ total: number; upcoming: number; avg_party: number }>(
    `select count(*)::int as total,
            count(*) filter (where date >= $1 and status in ('pending', 'confirmed'))::int as upcoming,
            coalesce(avg(party_size) filter (where status not in ('declined', 'cancelled')), 0)::float as avg_party
     from bookings`,
    [today],
  );
  const byDate = await query<{ date: string; n: number }>(
    `select date, count(*)::int as n
     from bookings
     where status not in ('declined', 'cancelled')
     group by date`,
  );
  const byTime = await query<{ time: string; n: number }>(
    `select time, count(*)::int as n
     from bookings
     where status not in ('declined', 'cancelled')
     group by time
     order by n desc
     limit 8`,
  );
  return {
    total: num(totals?.total),
    upcoming: num(totals?.upcoming),
    averageParty: num(totals?.avg_party),
    byDate: byDate.map((row) => ({ date: row.date, count: num(row.n) })),
    byTime: byTime.map((row) => ({ time: row.time, count: num(row.n) })),
  };
}

export async function liveBookingRows(start: string, end: string) {
  const rows = await query<{
    date: string;
    time: string;
    name: string;
    phone: string;
    email: string | null;
    party_size: number;
    status: string;
    notes: string | null;
  }>(
    `select date, time, name, phone, email, party_size, status, notes
     from bookings
     where date >= $1 and date <= $2
     order by date, time
     limit 800`,
    [start, end],
  );
  return rows;
}

export type LiveCustomer = {
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  spendPence: number;
  lastOrder: string | null;
  firstOrder: string | null;
  consent: string | null;
};

export async function liveCustomersFromOrders(): Promise<LiveCustomer[]> {
  const rows = await query<{
    phone: string;
    name: string;
    email: string | null;
    orders: number;
    spend_pence: number;
    last_order: string | null;
    first_order: string | null;
  }>(
    `select regexp_replace(phone, '[^0-9]', '', 'g') as phone,
            (array_agg(customer_name order by created_at desc))[1] as name,
            (array_agg(email order by created_at desc) filter (where email is not null and email <> ''))[1] as email,
            count(*) filter (where status <> 'cancelled')::int as orders,
            coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as spend_pence,
            max(collection_date) filter (where status <> 'cancelled') as last_order,
            min(collection_date) filter (where status <> 'cancelled') as first_order
     from orders
     where regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') <> ''
     group by 1
     having count(*) filter (where status <> 'cancelled') > 0`,
  );
  return rows.map((row) => ({
    name: row.name,
    phone: row.phone,
    email: row.email,
    orders: num(row.orders),
    spendPence: num(row.spend_pence),
    lastOrder: row.last_order,
    firstOrder: row.first_order,
    consent: null,
  }));
}

async function tableExists(name: string) {
  const [row] = await query<{ name: string | null }>("select to_regclass($1) as name", [`public.${name}`]);
  return Boolean(row?.name);
}

export async function liveCustomersFromDirectory(): Promise<LiveCustomer[]> {
  if (!(await tableExists("customers"))) return [];
  const rows = await query<{
    name: string | null;
    phone: string | null;
    email: string | null;
    orders: number | null;
    spend: string | null;
    last_order_date: string | null;
    marketing_consent: string | null;
  }>(
    `select name, phone, email, orders, spend::text as spend, last_order_date, marketing_consent
     from customers`,
  );
  return rows.map((row) => ({
    name: row.name || "Customer",
    phone: row.phone || "",
    email: row.email,
    orders: num(row.orders),
    spendPence: Math.round(num(row.spend) * 100),
    lastOrder: row.last_order_date,
    firstOrder: null,
    consent: row.marketing_consent,
  }));
}

export async function liveCustomersFromGloria(): Promise<LiveCustomer[]> {
  if (!(await tableExists("gloriafoodsexport"))) return [];
  const rows = await query<{
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    total_orders: number | null;
    total_spent: string | null;
    last_order: string | null;
  }>(
    `select first_name, last_name, phone, email, total_orders, total_spent,
            "last_order_date_(yyyy-mm-dd)" as last_order
     from gloriafoodsexport`,
  );
  return rows.map((row) => ({
    name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Imported customer",
    phone: row.phone || "",
    email: row.email,
    orders: num(row.total_orders),
    spendPence: Math.round(num(String(row.total_spent).replace(/[^0-9.]/g, "")) * 100),
    lastOrder: row.last_order,
    firstOrder: null,
    consent: null,
  }));
}

export async function liveVisitMonths(start: string, end: string) {
  const rows = await query<{ ym: string; orders: number; revenue_pence: number }>(
    `select substr(collection_date, 1, 7) as ym,
            count(*) filter (where status <> 'cancelled')::int as orders,
            coalesce(sum(subtotal_pence) filter (where status <> 'cancelled'), 0)::int as revenue_pence
     from orders
     where collection_date >= $1 and collection_date <= $2
     group by 1`,
    [start, end],
  );
  return rows.map((row) => ({ ym: row.ym, orders: num(row.orders), revenuePence: num(row.revenue_pence) }));
}

export async function liveTopItem(start: string, end: string) {
  const [row] = await query<{ name: string; category: string; quantity: number }>(
    `select oi.name,
            coalesce(mc.name, 'Uncategorised') as category,
            sum(oi.quantity)::int as quantity
     from order_items oi
     join orders o on o.id = oi.order_id
     left join menu_items mi on mi.id = oi.menu_item_id
     left join menu_categories mc on mc.id = mi.category_id
     where o.status <> 'cancelled' and o.collection_date >= $1 and o.collection_date <= $2
     group by oi.name, mc.name
     order by quantity desc, oi.name
     limit 1`,
    [start, end],
  );
  if (!row) return null;
  return { name: row.name, category: row.category, quantity: num(row.quantity) };
}
