import { adminGuard } from "@/lib/auth";
import { getVisitStatsSafe } from "@/lib/visits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live figures for the admin sidebar "Site visits" counter.
 * Returns { stats: null } when the visit table cannot be read, so the panel
 * keeps working and the counter just shows "unavailable".
 */
export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  const stats = await getVisitStatsSafe();
  return Response.json({ stats }, { headers: { "cache-control": "no-store" } });
}
