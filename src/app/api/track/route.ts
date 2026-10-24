import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isTrackablePath, recordVisit } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

function noContent() {
  return new Response(null, { status: 204, headers: NO_STORE });
}

/**
 * Records one public page view for the admin "Site visits" counter.
 *
 * Called by <VisitTracker /> with a keepalive fetch. It is intentionally quiet:
 * every failure (bad body, admin path, bot, rate limit, database down) answers
 * 204 so nothing on the public site can break because of analytics.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(`track:${ip}`, 120, 60_000)) return noContent();

  const userAgent = request.headers.get("user-agent");
  if (request.headers.get("sec-gpc") === "1") return noContent();

  let payload: { path?: unknown; referrer?: unknown } | null = null;
  try {
    payload = (await request.json()) as { path?: unknown; referrer?: unknown };
  } catch {
    return noContent();
  }

  if (!payload || !isTrackablePath(payload.path)) return noContent();

  try {
    await recordVisit({ path: payload.path, referrer: payload.referrer, ip, userAgent });
  } catch (error) {
    // recordVisit already swallows its own errors; this is the last line of defence.
    console.error("[track] unexpected failure", error);
  }
  return noContent();
}
