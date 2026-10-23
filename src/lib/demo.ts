import crypto from "node:crypto";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase, replaceMenu } from "@/db/bootstrap";
import { bookings, contactMessages, customers, orderItems, orders } from "@/db/schema";
import { DEMO_MENU } from "@/db/seed-data";
import { addDays, londonNow, weekdayOf } from "./hours";
import { getMenu } from "./menu";
import { getRestaurantProfile, saveRestaurantProfile } from "./restaurant";

/**
 * Demo data for evaluating the platform.
 *
 * Every demo record is flagged (`orders.is_demo`, `bookings.is_demo`,
 * `customers.source = 'demo'`, message names prefixed "Demo ·") so it can
 * be removed cleanly without touching real customer data.
 * Admin → Settings → "Reset Demo Data" restores this exact dataset.
 */

const DEMO_GUESTS = [
  { name: "Demo · Amelia Parker", phone: "020 7946 0101", email: "amelia@example.com" },
  { name: "Demo · James Khan", phone: "020 7946 0102", email: "james@example.com" },
  { name: "Demo · Priya Nair", phone: "020 7946 0103", email: "Priya@example.com" },
  { name: "Demo · Owen Reed", phone: "020 7946 0104", email: "owen@example.com" },
  { name: "Demo · Sofia Marino", phone: "020 7946 0105", email: "sofia@example.com" },
  { name: "Demo · Noah Baker", phone: "020 7946 0106", email: "noah@example.com" },
  { name: "Demo · Grace Wilson", phone: "020 7946 0107", email: "Grace@example.com" },
  { name: "Demo · Leo Turner", phone: "020 7946 0108", email: "leo@example.com" },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DemoStatus = { orders: number; bookings: number; customers: number; demoMode: boolean; setupCompleted: boolean };

export async function getDemoStatus(): Promise<DemoStatus> {
  await ensureDatabase();
  const profile = await getRestaurantProfile();
  const [o, b, c] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.isDemo, true)),
    db.select({ value: count() }).from(bookings).where(eq(bookings.isDemo, true)),
    db.select({ value: count() }).from(customers).where(eq(customers.source, "demo")),
  ]);
  return {
    orders: o[0]?.value ?? 0,
    bookings: b[0]?.value ?? 0,
    customers: c[0]?.value ?? 0,
    demoMode: profile.demoMode,
    setupCompleted: profile.setupCompleted,
  };
}

export async function clearDemoData(): Promise<DemoStatus> {
  await ensureDatabase();
  await db.delete(orders).where(eq(orders.isDemo, true)); // cascades to order_items
  await db.delete(bookings).where(eq(bookings.isDemo, true));
  await db.delete(customers).where(eq(customers.source, "demo"));
  const msgs = await db.select().from(contactMessages);
  for (const m of msgs) {
    if (m.name.startsWith("Demo ·")) await db.delete(contactMessages).where(eq(contactMessages.id, m.id));
  }
  return getDemoStatus();
}

/**
 * Restores the full demo dataset: demo menu, ~90 days of demo orders,
 * upcoming + past bookings, demo customers and two sample messages.
 * Real (non-demo) orders/bookings/customers are never touched; the menu
 * IS replaced with the demo menu (the UI warns about this).
 */
export async function resetDemoData(): Promise<DemoStatus> {
  await ensureDatabase();
  await clearDemoData();
  await replaceMenu(DEMO_MENU);

  const menu = await getMenu();
  const items = menu.flatMap((c) => c.items).filter((i) => i.groups.every((g) => !g.required));
  const today = londonNow().date;
  const random = rng(42_001);

  // Demo customers directory rows.
  const spendByPhone = new Map<string, { orders: number; spendPence: number; last: string }>();

  const orderRows: (typeof orders.$inferInsert)[] = [];
  const linePlans: { publicId: string; lines: { menuItemId: number; name: string; unitPricePence: number; quantity: number }[] }[] = [];

  for (let dayOffset = 89; dayOffset >= 0; dayOffset -= 1) {
    const date = addDays(today, -dayOffset);
    if (weekdayOf(date) === 1) continue; // demo restaurant is closed Mondays
    const perDay = weekdayOf(date) === 6 ? 4 : weekdayOf(date) === 5 ? 3 : 2;
    for (let n = 0; n < perDay; n += 1) {
      if (random() < 0.18) continue;
      const guest = DEMO_GUESTS[Math.floor(random() * DEMO_GUESTS.length)] ?? DEMO_GUESTS[0];
      const lineCount = 1 + Math.floor(random() * 3);
      const lines: { menuItemId: number; name: string; unitPricePence: number; quantity: number }[] = [];
      let subtotal = 0;
      let itemCount = 0;
      for (let l = 0; l < lineCount; l += 1) {
        const item = items[Math.floor(random() * items.length)];
        if (!item) continue;
        const quantity = 1 + Math.floor(random() * 2);
        lines.push({ menuItemId: item.id, name: item.name, unitPricePence: item.pricePence, quantity });
        subtotal += item.pricePence * quantity;
        itemCount += quantity;
      }
      if (!lines.length) continue;
      const publicId = `demo_${crypto.randomBytes(8).toString("base64url")}`;
      const time = ["12:30", "13:00", "18:00", "18:30", "19:00", "19:30", "20:00"][Math.floor(random() * 7)] ?? "19:00";
      const status = date < today ? "collected" : random() > 0.5 ? "new" : "accepted";
      orderRows.push({
        publicId,
        customerName: guest.name,
        phone: guest.phone,
        email: guest.email,
        instructions: null,
        collectionDate: date,
        collectionTime: time,
        subtotalPence: subtotal,
        itemCount,
        status,
        paymentMethod: "pay_on_collection",
        paymentStatus: status === "collected" ? "paid" : "unpaid",
        isDemo: true,
        emailStatus: "logged",
      });
      linePlans.push({ publicId, lines });
      const agg = spendByPhone.get(guest.phone) ?? { orders: 0, spendPence: 0, last: date };
      agg.orders += 1;
      agg.spendPence += subtotal;
      if (date > agg.last) agg.last = date;
      spendByPhone.set(guest.phone, agg);
    }
  }

  if (orderRows.length) {
    const inserted = await db.insert(orders).values(orderRows).returning({ id: orders.id, publicId: orders.publicId });
    const idByPublic = new Map(inserted.map((r) => [r.publicId, r.id]));
    const itemRows: (typeof orderItems.$inferInsert)[] = [];
    for (const plan of linePlans) {
      const orderId = idByPublic.get(plan.publicId);
      if (!orderId) continue;
      for (const line of plan.lines) {
        itemRows.push({
          orderId,
          menuItemId: line.menuItemId,
          name: line.name,
          options: [],
          unitPricePence: line.unitPricePence,
          quantity: line.quantity,
          lineTotalPence: line.unitPricePence * line.quantity,
        });
      }
    }
    if (itemRows.length) await db.insert(orderItems).values(itemRows);
  }

  // Demo bookings: past confirmed + upcoming pending/confirmed.
  const bookingRows: (typeof bookings.$inferInsert)[] = [];
  for (let i = 0; i < 24; i += 1) {
    const guest = DEMO_GUESTS[i % DEMO_GUESTS.length];
    const offset = i < 14 ? -(3 + i * 2) : i - 12;
    const date = addDays(today, offset);
    if (weekdayOf(date) === 1) continue;
    bookingRows.push({
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      partySize: 2 + (i % 5),
      date,
      time: ["12:30", "18:30", "19:00", "19:30"][i % 4] ?? "19:00",
      notes: i % 5 === 0 ? "Window table if possible (demo)" : null,
      status: offset < 0 ? "confirmed" : i % 3 === 0 ? "pending" : "confirmed",
      isDemo: true,
    });
  }
  if (bookingRows.length) await db.insert(bookings).values(bookingRows);

  // Demo customer directory.
  const customerRows = DEMO_GUESTS.map((g) => {
    const agg = spendByPhone.get(g.phone);
    return {
      name: g.name,
      phone: g.phone.replace(/\s/g, ""),
      email: g.email,
      orders: agg?.orders ?? 1,
      spend: String(((agg?.spendPence ?? 2500) / 100).toFixed(2)),
      lastOrderDate: agg?.last ?? today,
      marketingConsent: "no",
      source: "demo",
    };
  });
  await db.insert(customers).values(customerRows);

  await db.insert(contactMessages).values([
    {
      name: "Demo · Amelia Parker",
      email: "amelia@example.com",
      phone: "020 7946 0101",
      message: "Hello — this is a demo message. Do you have a high chair available for Saturday lunch?",
      read: false,
    },
    {
      name: "Demo · James Khan",
      email: "james@example.com",
      phone: null,
      message: "Demo message: we loved our visit last weekend, thank you to the whole team!",
      read: true,
    },
  ]);

  const profile = await getRestaurantProfile();
  if (!profile.setupCompleted) {
    await saveRestaurantProfile({ ...profile, demoMode: true });
  }
  return getDemoStatus();
}
