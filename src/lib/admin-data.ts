import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { bookings, contactMessages, orders } from "@/db/schema";
import { londonNow } from "./hours";
import { BOOKING_STATUSES, type BookingStatus, type BookingView, type MessageView } from "./types";

export async function getAdminCounts() {
  await ensureDatabase();
  const [o, b, m] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.status, "new")),
    db.select({ value: count() }).from(bookings).where(eq(bookings.status, "pending")),
    db.select({ value: count() }).from(contactMessages).where(eq(contactMessages.read, false)),
  ]);
  return { newOrders: o[0]?.value ?? 0, pendingBookings: b[0]?.value ?? 0, unreadMessages: m[0]?.value ?? 0 };
}

export async function getDashboardStats() {
  await ensureDatabase();
  const today = londonNow().date;
  const [todayAgg, counts] = await Promise.all([
    db
      .select({ value: count(), total: sql<string>`coalesce(sum(${orders.subtotalPence}), 0)` })
      .from(orders)
      .where(and(eq(orders.collectionDate, today), ne(orders.status, "cancelled"))),
    getAdminCounts(),
  ]);
  return {
    ...counts,
    todayOrders: todayAgg[0]?.value ?? 0,
    todayValue: Number(todayAgg[0]?.total ?? 0),
  };
}

export function toBookingView(r: typeof bookings.$inferSelect): BookingView {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    partySize: r.partySize,
    date: r.date,
    time: r.time,
    notes: r.notes,
    status: (BOOKING_STATUSES as readonly string[]).includes(r.status) ? (r.status as BookingStatus) : "pending",
    isDemo: Boolean((r as { isDemo?: boolean }).isDemo),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listBookings(limit = 400): Promise<BookingView[]> {
  await ensureDatabase();
  const rows = await db.select().from(bookings).orderBy(desc(bookings.date), desc(bookings.time)).limit(limit);
  return rows.map(toBookingView);
}

export async function listMessages(limit = 300): Promise<MessageView[]> {
  await ensureDatabase();
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    read: r.read,
    createdAt: r.createdAt.toISOString(),
  }));
}
