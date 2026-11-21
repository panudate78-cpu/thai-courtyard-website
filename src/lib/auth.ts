import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "tc_admin_session";
const SESSION_DAYS = 14;

/** Set ADMIN_PASSWORD in the environment. The fallback exists only so a fresh preview is usable. */
function adminPassword() {
  return process.env.ADMIN_PASSWORD || "Th@1courtyard!";
}

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    crypto.createHash("sha256").update(`thai-courtyard:${adminPassword()}:${process.env.DATABASE_URL ?? ""}`).digest("hex")
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

/**
 * Check password against DB hash (bcrypt) first, then fallback to env ADMIN_PASSWORD.
 * Keeps Thai Courtyard live working with env, while white-label clients set their own password via /setup wizard (stored hashed in restaurant_config).
 */
export async function checkPasswordAsync(input: string): Promise<boolean> {
  try {
    const { getRestaurantConfig } = await import("./restaurant");
    const cfg = await getRestaurantConfig();
    if (cfg.adminPasswordHash) {
      try {
        const bcrypt = await import("bcryptjs");
        if (await bcrypt.compare(input, cfg.adminPasswordHash)) return true;
      } catch {}
      // Fallback: legacy sha256 hex hash (if bcrypt not available)
      try {
        const hex = crypto.createHash("sha256").update(input).digest("hex");
        if (hex === cfg.adminPasswordHash) return true;
      } catch {}
      return false;
    }
  } catch {}
  // Fallback to env-based check (Thai Courtyard default)
  return checkPassword(input);
}

export function checkPassword(input: string) {
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(adminPassword()).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function hashPassword(input: string): Promise<string> {
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.hash(input, 10);
  } catch {
    // Fallback if bcryptjs missing — sha256 hex (not bcrypt-strength but functional until bcrypt installed)
    return crypto.createHash("sha256").update(input).digest("hex");
  }
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
