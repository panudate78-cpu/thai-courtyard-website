import { NextResponse, type NextRequest } from "next/server";
import { pool } from "@/db";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Allow either admin session OR correct SETUP_TOKEN
  const admin = await isAdmin();
  const envToken = process.env.SETUP_TOKEN;
  let bodyToken: string | undefined = undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { token?: unknown };
    bodyToken = typeof body.token === "string" ? body.token : undefined;
  } catch {}
  const headerToken = req.headers.get("x-setup-token") || "";
  const urlToken = req.nextUrl.searchParams.get("token") || "";
  const tokenOk = !envToken || headerToken === envToken || urlToken === envToken || bodyToken === envToken;

  if (!admin && !tokenOk) {
    return NextResponse.json({ error: "Not authorized — admin login or valid SETUP_TOKEN required" }, { status: 401 });
  }

  try {
    await pool.query(`UPDATE restaurant_config SET setup_completed=false, updated_at=now() WHERE id=1`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
