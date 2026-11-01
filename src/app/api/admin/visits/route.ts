import type { NextRequest } from "next/server";
import { adminGuard } from "@/lib/auth";
import { getVisitStatsSafe } from "@/lib/visits";
import { loadOutsideWindow } from "@/lib/window-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live figures for the admin sidebar "Site visits" counter.
 * Returns { stats: null } when the visit table cannot be read, so the panel
 * keeps working and the counter just shows "unavailable".
 *
 * Outside trading hours a stale client polling this endpoint gets the last
 * snapshot instead of a database query (see window-cache.ts).
 */
export async function GET(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const { payload, cached } = await loadOutsideWindow("visits", () => getVisitStatsSafe(), { fresh });
  return Response.json({ stats: payload, cached }, { headers: { "cache-control": "no-store" } });
}
