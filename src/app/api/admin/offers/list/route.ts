import { asc } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { offers } from "@/db/schema";
import { adminGuard } from "@/lib/auth";
import { offerStatus } from "@/lib/offers";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  try {
    await ensureDatabase();
    const rows = await db.select().from(offers).orderBy(asc(offers.displayOrder), asc(offers.id));
    return Response.json(rows.map((offer) => ({ ...offer, status: offerStatus(offer) })), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[admin/offers] list failed", error);
    return Response.json({ error: "Could not load offers." }, { status: 500 });
  }
}
