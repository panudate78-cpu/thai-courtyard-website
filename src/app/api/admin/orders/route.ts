import type { NextRequest } from "next/server";
import { adminGuard } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import { loadOutsideWindow } from "@/lib/window-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "live";
  // Stale clients keep polling outside trading hours; serve the last snapshot
  // instead of waking the database. `?fresh=1` (the Refresh button) overrides.
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const { payload, cached } = await loadOutsideWindow(`orders:${scope}`, () => listOrders({ scope }), { fresh });
  return Response.json({ orders: payload, cached }, { headers: { "Cache-Control": "no-store" } });
}
