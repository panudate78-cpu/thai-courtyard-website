import type { NextRequest } from "next/server";
import { adminGuard } from "@/lib/auth";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await adminGuard();
  if (denied) return denied;
  const scope = req.nextUrl.searchParams.get("scope") === "all" ? "all" : "live";
  const orders = await listOrders({ scope });
  return Response.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
