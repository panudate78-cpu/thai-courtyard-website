import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, checkPasswordAsync, createSessionToken } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }
  const body = (await readJson(req)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !(await checkPasswordAsync(password))) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const { token, maxAge } = createSessionToken();
  const res = NextResponse.json({ ok: true });
  const secure = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
