import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

function tokenOk(req: NextRequest, bodyToken?: string | null): boolean {
  const env = process.env.SETUP_TOKEN;
  if (!env) return true;
  const h = req.headers.get("x-setup-token") || "";
  const q = req.nextUrl.searchParams.get("token") || "";
  const b = bodyToken || "";
  return h === env || q === env || b === env;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {}
  const bodyToken = typeof body.token === "string" ? body.token : null;
  if (!tokenOk(req, bodyToken)) return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });

  const adminPassword = typeof body.adminPassword === "string" ? body.adminPassword : "";
  if (!adminPassword || adminPassword.length < 8) {
    return NextResponse.json({ error: "Admin password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const { hashPassword } = await import("@/lib/auth");
    const hash = await hashPassword(adminPassword);
    await pool.query(`UPDATE restaurant_config SET admin_password_hash=$1, setup_completed=true, updated_at=now() WHERE id=1`, [hash]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[setup/complete]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to complete setup" }, { status: 500 });
  }
}
