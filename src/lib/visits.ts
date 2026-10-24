import crypto from "node:crypto";
import { pool } from "@/db";
import { ensureVisitsTable } from "@/db/visits-migration";
import { addDays, formatDateShort, londonNow } from "@/lib/hours";

/**
 * Anonymous public-site visit counting.
 *
 * One row per page view of the public website. Admin pages, API routes and
 * Next.js assets are rejected before anything is written, so staff browsing the
 * dashboard never inflates the numbers.
 *
 * Privacy: there are no cookies and no stored IP addresses. `visitorKey` is an
 * HMAC of the IP + user agent with a salt that changes every London day. That
 * is enough to count distinct visitors for one day, and it cannot be used to
 * recognise the same person on another day.
 */

export type VisitDay = { date: string; label: string; views: number };

export type VisitStats = {
  /** Page views today (Europe/London). */
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  total: number;
  /** Distinct anonymous visitor hashes seen today. */
  uniqueToday: number;
  /** Seven entries, oldest first, always ending with today. */
  days: VisitDay[];
  /** ISO timestamp of when these figures were read. */
  updatedAt: string;
};

type AggregateRow = {
  total: number;
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  unique_today: number;
};

/** Assets and app routes that should never count as a page view. */
const SKIPPED_PREFIXES = ["/api", "/_next", "/images/"];

const SKIPPED_PATHS = new Set([
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

const BOT_PATTERN =
  /bot|crawl|spider|slurp|archiver|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|prerender|screenshot|scrap|curl|wget|python|axios|node-fetch|go-http|java\/|okhttp|facebookexternalhit|whatsapp|telegram|discord|slack|embedly|semrush|ahrefs|mj12|dotbot|petalbot|yandex|baidu|applebot|bingpreview/i;

/**
 * True for a public page path. Admin views are excluded here as well as in the
 * tracker, so a stray request can never record an admin page.
 */
export function isTrackablePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  const clean = path.trim();
  if (!clean.startsWith("/") || clean.startsWith("//")) return false;
  if (clean.length > 200) return false;
  const lower = clean.toLowerCase();
  if (lower === "/admin" || lower.startsWith("/admin/") || lower.startsWith("/admin?")) return false;
  if (SKIPPED_PATHS.has(lower)) return false;
  if (SKIPPED_PREFIXES.some((prefix) => lower.startsWith(prefix))) return false;
  return true;
}

/** Search engines, link-preview fetchers and uptime monitors are not visitors. */
export function isBotRequest(userAgent: string | null | undefined) {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

/**
 * Keep only the referring host ("google.com"), never the full URL or its query
 * string. Returns null for direct traffic.
 */
export function normalizeReferrer(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
    return host && host.length <= 120 ? host.slice(0, 120) : null;
  } catch {
    return null;
  }
}

let cachedSalt: string | null = null;

function visitSalt() {
  if (cachedSalt) return cachedSalt;
  cachedSalt =
    process.env.VISIT_HASH_SALT ||
    process.env.ADMIN_SESSION_SECRET ||
    crypto
      .createHash("sha256")
      .update(`thai-courtyard-visits:${process.env.DATABASE_URL ?? "local"}`)
      .digest("hex");
  return cachedSalt;
}

/** Day-scoped anonymous visitor id. Deliberately not reversible. */
function visitorKey(ip: string | null | undefined, userAgent: string | null | undefined, day: string) {
  return crypto
    .createHmac("sha256", `${visitSalt()}:${day}`)
    .update(`${ip || "unknown"}|${userAgent || "unknown"}`)
    .digest("hex")
    .slice(0, 32);
}

/** Records one public page view. Never throws; returns false when skipped. */
export async function recordVisit(input: {
  path: unknown;
  referrer?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<boolean> {
  const path = input.path;
  if (!isTrackablePath(path)) return false;
  if (isBotRequest(input.userAgent)) return false;
  // Store a clean path: no query string or hash (the client only sends the
  // pathname, this is belt and braces for anything else posting here).
  const storedPath = path.trim().split(/[?#]/, 1)[0].slice(0, 200);
  try {
    const ready = await ensureVisitsTable();
    if (!ready) return false;
    const day = londonNow().date;
    await pool.query(
      `insert into site_visits (path, visitor_key, referrer) values ($1, $2, $3)`,
      [storedPath, visitorKey(input.ip, input.userAgent, day), normalizeReferrer(input.referrer)],
    );
    return true;
  } catch (error) {
    // A counter must never break a page load or an order.
    console.error("[visits] could not record page view", error);
    return false;
  }
}

/** Reads the counters used by the admin sidebar. Throws if the database fails. */
export async function getVisitStats(): Promise<VisitStats> {
  await ensureVisitsTable();
  const today = londonNow().date;
  const yesterday = addDays(today, -1);
  const weekStart = addDays(today, -6);
  const monthStart = addDays(today, -29);

  const [aggregate, series] = await Promise.all([
    pool.query<AggregateRow>(
      `with visits as (
         select (created_at at time zone 'Europe/London')::date as day, visitor_key
         from site_visits
       )
       select count(*)::int as total,
              count(*) filter (where day = $1::date)::int as today,
              count(*) filter (where day = $2::date)::int as yesterday,
              count(*) filter (where day >= $3::date)::int as last7,
              count(*) filter (where day >= $4::date)::int as last30,
              count(distinct visitor_key) filter (where day = $1::date and visitor_key is not null)::int
                as unique_today
       from visits`,
      [today, yesterday, weekStart, monthStart],
    ),
    pool.query<{ date: string; views: number }>(
      `select (created_at at time zone 'Europe/London')::date::text as date,
              count(*)::int as views
       from site_visits
       where (created_at at time zone 'Europe/London')::date >= $1::date
       group by 1`,
      [weekStart],
    ),
  ]);

  const row = aggregate.rows[0];
  const byDate = new Map(series.rows.map((entry) => [entry.date, Number(entry.views) || 0]));
  const days: VisitDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, label: formatDateShort(date), views: byDate.get(date) ?? 0 };
  });

  return {
    today: Number(row?.today) || 0,
    yesterday: Number(row?.yesterday) || 0,
    last7: Number(row?.last7) || 0,
    last30: Number(row?.last30) || 0,
    total: Number(row?.total) || 0,
    uniqueToday: Number(row?.unique_today) || 0,
    days,
    updatedAt: new Date().toISOString(),
  };
}

/** Never throws — used by the admin layout so a counter outage cannot block the panel. */
export async function getVisitStatsSafe(): Promise<VisitStats | null> {
  try {
    return await getVisitStats();
  } catch (error) {
    console.error("[visits] stats unavailable", error);
    return null;
  }
}
