import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

function tokenOk(req: NextRequest): boolean {
  const env = process.env.SETUP_TOKEN;
  if (!env) return true;
  const h = req.headers.get("x-setup-token") || "";
  const q = req.nextUrl.searchParams.get("token") || "";
  return h === env || q === env;
}

export async function GET(req: NextRequest) {
  if (!tokenOk(req)) return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });

  const checks: Record<string, unknown> = {};

  // DATABASE_URL
  try {
    const start = Date.now();
    await pool.query("select 1 as ok");
    checks.database = { ok: true, latencyMs: Date.now() - start, urlPresent: Boolean(process.env.DATABASE_URL) };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : String(e), urlPresent: Boolean(process.env.DATABASE_URL) };
  }

  // Drizzle tables
  try {
    const { rows } = await pool.query(`select to_regclass('public.restaurant_config') as rc, to_regclass('public.menu_items') as mi`);
    checks.tables = { ok: Boolean(rows[0]?.rc && rows[0]?.mi), detail: rows[0] };
  } catch (e) {
    checks.tables = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // BLOB
  checks.blob = {
    ok: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    tokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hint: process.env.BLOB_READ_WRITE_TOKEN ? "BLOB_READ_WRITE_TOKEN is set — uploads will work" : "Set BLOB_READ_WRITE_TOKEN in Vercel → Storage → Blob → .env.local + Vercel env",
  };

  // SMTP / Email
  const smtpHost = process.env.SMTP_HOST || "";
  const smtpPort = process.env.SMTP_PORT || "";
  const smtpUser = process.env.SMTP_USER || "";
  const emailFrom = process.env.EMAIL_FROM || process.env.SMTP_FROM || "";
  const restaurantEmail = process.env.RESTAURANT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || "";
  const resendKey = process.env.RESEND_API_KEY || "";
  checks.email = {
    ok: Boolean((smtpHost && smtpUser) || resendKey),
    smtpHostPresent: Boolean(smtpHost),
    smtpPortPresent: Boolean(smtpPort),
    smtpUserPresent: Boolean(smtpUser),
    emailFromPresent: Boolean(emailFrom),
    restaurantEmailPresent: Boolean(restaurantEmail),
    resendPresent: Boolean(resendKey),
    hint: (smtpHost && smtpUser) || resendKey ? "Email provider configured" : "Set SMTP_HOST/PORT/USER/PASS + EMAIL_FROM + RESTAURANT_EMAIL (or RESEND_API_KEY)",
  };

  // Site URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const host = req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const currentHost = host ? `${proto}://${host}` : "";
  checks.siteUrl = {
    ok: Boolean(siteUrl),
    env: siteUrl || "(not set — falling back to request host)",
    currentHost,
    matches: siteUrl ? siteUrl.replace(/\/$/, "") === currentHost.replace(/\/$/, "") : null,
    hint: siteUrl ? "NEXT_PUBLIC_SITE_URL is set" : "Set NEXT_PUBLIC_SITE_URL to your canonical domain (e.g. https://www.example.co.uk)",
  };

  // Setup completed
  try {
    const { rows } = await pool.query(`SELECT setup_completed, restaurant_name FROM restaurant_config WHERE id=1`);
    checks.setup = { ok: true, setupCompleted: rows[0]?.setup_completed ?? false, restaurantName: rows[0]?.restaurant_name ?? null };
  } catch (e) {
    checks.setup = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Env presence summary
  checks.env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    SMTP_HOST: Boolean(process.env.SMTP_HOST),
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    SETUP_TOKEN: Boolean(process.env.SETUP_TOKEN),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
  };

  return NextResponse.json(checks);
}
