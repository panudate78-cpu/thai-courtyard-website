import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "rmp_admin_session";
const SESSION_DAYS = 14;

/** Set ADMIN_PASSWORD in the environment (see .env.example). The fallback exists only so a fresh local/preview install is usable — change it before going live. */
export function isUsingFallbackPassword() {
  return !process.env.ADMIN_PASSWORD;
}
function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    crypto.createHash("sha256").update(`restaurant-platform:${adminPassword()}:${process.env.DATABASE_URL ?? ""}`).digest("hex")
  );
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(adminPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const payload = `admin.${expires}`;
  return { token: `${payload}.${sign(payload)}`, maxAge: SESSION_DAYS * 86_400 };
}

export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = token.slice(0, idx);
  if (!safeEqual(sign(payload), token.slice(idx + 1))) return false;
  const expires = Number(payload.split(".")[1]);
  return Number.isFinite(expires) && expires > Date.now();
}

export async function isAdmin() {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** For API routes: returns a 401 response when not signed in, otherwise null. */
export async function adminGuard() {
  return (await isAdmin()) ? null : Response.json({ error: "Your session has expired — please sign in again." }, { status: 401 });
}
