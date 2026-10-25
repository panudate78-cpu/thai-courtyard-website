import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { offers } from "@/db/schema";
import { londonNow } from "@/lib/hours";

export type OfferRecord = typeof offers.$inferSelect;
export type OfferStatus = "Active" | "Scheduled" | "Expired" | "Disabled";

export function offerStatus(offer: Pick<OfferRecord, "enabled" | "startsOn" | "endsOn">, today = londonNow().date): OfferStatus {
  if (!offer.enabled) return "Disabled";
  if (offer.startsOn > today) return "Scheduled";
  if (offer.endsOn < today) return "Expired";
  return "Active";
}

export async function getOffers() {
  await ensureDatabase();
  const rows = await db.select().from(offers).orderBy(asc(offers.displayOrder), asc(offers.id));
  return rows.map((offer) => ({ ...offer, status: offerStatus(offer) }));
}

export async function getActiveOffers() {
  await ensureDatabase();
  const today = londonNow().date;
  return db
    .select({
      id: offers.id,
      title: offers.title,
      description: offers.description,
      ctaText: offers.ctaText,
      ctaLink: offers.ctaLink,
      imageData: offers.imageData,
      startsOn: offers.startsOn,
      endsOn: offers.endsOn,
      displayOrder: offers.displayOrder,
    })
    .from(offers)
    .where(and(eq(offers.enabled, true), lte(offers.startsOn, today), gte(offers.endsOn, today)))
    .orderBy(asc(offers.displayOrder), asc(offers.id));
}
