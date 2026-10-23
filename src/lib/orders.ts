import crypto from "node:crypto";
import { asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { ensureCustomersTable } from "@/db/ensure-customers";
import { customers, gloriaFoodCustomers, orderItems, orders } from "@/db/schema";
import { withDatabaseError } from "./db-error";
import {
  orderCustomerEmail,
  orderReadyEmail,
  orderRestaurantEmail,
  restaurantEmail,
  sendMail,
  setEmailBrand,
  type MailResult,
} from "./email";
import { orderNumber } from "./format";
import { isValidCollectionSlot, londonNow } from "./hours";
import { getMenu } from "./menu";
import type { PaymentMethod } from "./payments";
import { getHolidayExceptions, getOpeningHoursMap, getRestaurantConfigSafe } from "./restaurant";
import { getSettings, toSlotConfig } from "./settings";
import { ORDER_STATUSES, type MenuItem, type OrderOption, type OrderStatus, type OrderView, type Settings } from "./types";

type OrderRow = typeof orders.$inferSelect;
type OrderItemRow = typeof orderItems.$inferSelect;

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.status = status;
  }
}

export type OrderInput = {
  items: { itemId: number; quantity: number; choiceIds: number[] }[];
  collectionDate: string;
  collectionTime: string;
  name: string;
  phone: string;
  email: string | null;
  instructions: string | null;
  paymentMethod?: PaymentMethod;
};

function toStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "new";
}

function toView(o: OrderRow, items: OrderItemRow[], customerStatus?: string): OrderView {
  const row = o as OrderRow & { paymentMethod?: string; paymentStatus?: string; isDemo?: boolean };
  return {
    id: o.id,
    number: orderNumber(o.id),
    publicId: o.publicId,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    instructions: o.instructions,
    collectionDate: o.collectionDate,
    collectionTime: o.collectionTime,
    subtotalPence: o.subtotalPence,
    itemCount: o.itemCount,
    status: toStatus(o.status),
    paymentMethod: row.paymentMethod ?? "pay_on_collection",
    paymentStatus: row.paymentStatus ?? "unpaid",
    isDemo: Boolean(row.isDemo),
    emailStatus: o.emailStatus,
    createdAt: o.createdAt.toISOString(),
    customerStatus,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      unitPricePence: i.unitPricePence,
      lineTotalPence: i.lineTotalPence,
      options: Array.isArray(i.options) ? i.options : [],
    })),
  };
}

export function normalisePhone(phone: string) {
  return phone
    .trim()
    .replace(/\s+/g, "")
    .replace(/[()-]/g, "")
    .replace(/^\+44/, "0")
    .replace(/^44/, "0");
}

function customerStatusFor(orderCount: number | null | undefined) {
  if (orderCount && orderCount >= 25) return "👑 VIP CUSTOMER";
  if (orderCount && orderCount >= 10) return "⭐ GOLD CUSTOMER";
  if (orderCount && orderCount >= 2) return "🟢 RETURNING CUSTOMER";
  return "🆕 NEW CUSTOMER";
}

async function withItems(rows: OrderRow[]): Promise<OrderView[]> {
  if (!rows.length) return [];
  await ensureCustomersTable();
  const items = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(orderItems.id));
  const byOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const list = byOrder.get(item.orderId) ?? [];
    list.push(item);
    byOrder.set(item.orderId, list);
  }
  const customerRows = await withDatabaseError(() => db.select().from(customers));
  const byPhone = new Map(customerRows.map((c) => [normalisePhone(c.phone ?? ""), c]));
  return rows.map((r) => {
    const customer = byPhone.get(normalisePhone(r.phone ?? ""));
    return toView(r, byOrder.get(r.id) ?? [], customerStatusFor(customer?.orders));
  });
}

/** Validates the basket against the live menu (server-side pricing) and stores the order. */
export async function createOrder(input: OrderInput): Promise<{ order: OrderView; settings: Settings }> {
  const settings = await getSettings();
  if (!settings.orderingEnabled) {
    throw new OrderError(settings.pausedMessage || "Online ordering is currently paused. Please call us to place your order.", 409);
  }
  const [openingHours, holidays, config] = await Promise.all([getOpeningHoursMap(), getHolidayExceptions(), getRestaurantConfigSafe()]);
  if (!config.collection.enabled) {
    throw new OrderError("Collection ordering is currently unavailable. Please call us to place your order.", 409);
  }
  // Online (Stripe) checkout is not wired up yet — never accept it server-side.
  const paymentMethod: PaymentMethod = "pay_on_collection";
  if (!config.payments.payOnCollection) {
    throw new OrderError("Online payment is coming soon. Please call us to place your order.", 409);
  }
  if (!isValidCollectionSlot(input.collectionDate, input.collectionTime, toSlotConfig(settings, { openingHours, holidays }))) {
    throw new OrderError("Sorry, that collection time is no longer available. Please choose another time.");
  }

  const existingCustomer = await findCustomerByPhone(normalisePhone(input.phone));
  const menu = await getMenu();
  const itemMap = new Map<number, MenuItem>();
  for (const c of menu) for (const i of c.items) itemMap.set(i.id, i);

  const lines = input.items.map((line) => {
    const item = itemMap.get(line.itemId);
    if (!item || !item.available) {
      throw new OrderError(`Sorry, ${item?.name ?? "an item in your basket"} is currently unavailable. Please remove it and try again.`);
    }
    const chosen = new Set(line.choiceIds);
    const used = new Set<number>();
    const options: OrderOption[] = [];
    let unit = item.pricePence;
    for (const group of item.groups) {
      const picks = group.choices.filter((c) => chosen.has(c.id));
      if (group.required && picks.length === 0) {
        throw new OrderError(`Please choose a ${group.name.replace(/^choice of /i, "").toLowerCase()} for ${item.name}.`);
      }
      if (picks.length > Math.max(1, group.maxSelect)) throw new OrderError(`Too many options selected for ${item.name}.`);
      for (const pick of picks) {
        if (!pick.available) throw new OrderError(`${pick.name} is currently unavailable for ${item.name}.`);
        used.add(pick.id);
        unit += pick.pricePence;
        options.push({ group: group.name, choice: pick.name, pricePence: pick.pricePence });
      }
    }
    for (const id of chosen) {
      if (!used.has(id)) throw new OrderError(`An option for ${item.name} is no longer available. Please re-add it.`);
    }
    return {
      menuItemId: item.id,
      name: item.name,
      options,
      unitPricePence: unit,
      quantity: line.quantity,
      lineTotalPence: unit * line.quantity,
    };
  });

  const subtotalPence = lines.reduce((sum, l) => sum + l.lineTotalPence, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  const publicId = crypto.randomBytes(12).toString("base64url");

  const order = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(orders)
      .values({
        publicId,
        customerName: input.name,
        phone: input.phone,
        email: input.email,
        instructions: input.instructions,
        collectionDate: input.collectionDate,
        collectionTime: input.collectionTime,
        subtotalPence,
        itemCount,
        paymentMethod,
        paymentStatus: "unpaid",
        isDemo: false,
      })
      .returning();

    const itemRows = await tx
      .insert(orderItems)
      .values(lines.map((l) => ({ ...l, orderId: row.id })))
      .returning();

    if (existingCustomer) {
      await tx
        .update(customers)
        .set({
          orders: (existingCustomer.orders ?? 0) + 1,
          spend: String(Number(existingCustomer.spend ?? 0) + subtotalPence / 100),
          lastOrderDate: input.collectionDate,
          email: input.email,
          name: input.name,
        })
        .where(eq(customers.id, existingCustomer.id));
    } else {
      await tx.insert(customers).values({
        name: input.name,
        phone: normalisePhone(input.phone),
        email: input.email,
        orders: 1,
        spend: String(subtotalPence / 100),
        lastOrderDate: input.collectionDate,
        source: "website",
      });
    }

    return toView(row, itemRows);
  });

  return { order, settings };
}

export async function sendOrderNotifications(order: OrderView, settings: Settings) {
  const config = await getRestaurantConfigSafe();
  setEmailBrand(config.name);
  const to = restaurantEmail(settings, config);
  const restaurantMail = orderRestaurantEmail(order, config);
  let result: MailResult = "logged";
  if (to) {
    result = await sendMail({ to, ...restaurantMail, replyTo: order.email });
  } else {
    console.info(`[email:no-recipient] ${restaurantMail.subject}\n${restaurantMail.text}`);
  }
  if (order.email) await sendMail({ to: order.email, ...orderCustomerEmail(order, config) });
  await db.update(orders).set({ emailStatus: result }).where(eq(orders.id, order.id));
}

export async function sendOrderReadyEmail(order: OrderView) {
  if (!order.email) return;
  const config = await getRestaurantConfigSafe();
  setEmailBrand(config.name);
  await sendMail({ to: order.email, ...orderReadyEmail(order, config) });
}

export async function getOrderByPublicId(publicId: string) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(publicId)) return null;
  await ensureDatabase();
  const rows = await db.select().from(orders).where(eq(orders.publicId, publicId)).limit(1);
  const [view] = await withItems(rows);
  return view ?? null;
}

export async function listOrders({ scope, limit = 250 }: { scope: "live" | "all"; limit?: number }) {
  await ensureDatabase();
  if (scope === "live") {
    const today = londonNow().date;
    const rows = await db
      .select()
      .from(orders)
      .where(or(inArray(orders.status, ["new", "accepted", "ready"]), eq(orders.collectionDate, today)))
      .orderBy(asc(orders.collectionDate), asc(orders.collectionTime), asc(orders.id))
      .limit(limit);
    return withItems(rows);
  }
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  return withItems(rows);
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await ensureDatabase();
  const patch: { status: OrderStatus; updatedAt: Date; paymentStatus?: string } = { status, updatedAt: new Date() };
  if (status === "collected") patch.paymentStatus = "paid";
  const rows = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();
  const [view] = await withItems(rows);
  return view ?? null;
}

/* ------------------------------ Customers ------------------------------ */

export type CustomerStatsRow = {
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  /** Spend in pence. */
  spend: number;
  lastOrder: Date | string | null;
  source?: string;
};

export async function getCustomerStats(): Promise<CustomerStatsRow[]> {
  await ensureDatabase();
  const rows = await db.select().from(orders);
  const map = new Map<string, CustomerStatsRow>();
  for (const order of rows) {
    const key = normalisePhone(order.phone);
    const existing =
      map.get(key) ??
      ({
        name: order.customerName,
        phone: key,
        email: order.email,
        orders: 0,
        spend: 0,
        lastOrder: order.createdAt,
      } satisfies CustomerStatsRow);
    existing.orders += 1;
    existing.spend += order.subtotalPence;
    if (new Date(order.createdAt) > new Date(existing.lastOrder ?? 0)) existing.lastOrder = order.createdAt;
    map.set(key, existing);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export async function getCustomerCount() {
  await ensureDatabase();
  const rows = await db.select({ phone: orders.phone }).from(orders);
  return new Set(rows.map((o) => normalisePhone(o.phone))).size;
}

/** Legacy imported-customer table (optional; absent on fresh installs). */
export async function getImportedCustomers() {
  try {
    return await db.select().from(gloriaFoodCustomers);
  } catch {
    return [];
  }
}
/** @deprecated Use getImportedCustomers. Kept for backwards compatibility with older admin code. */
export const getGloriaFoodCustomers = getImportedCustomers;

export async function getCombinedCustomerStats(): Promise<CustomerStatsRow[]> {
  const liveCustomers = await getCustomerStats();
  const imported = await getImportedCustomers().catch(() => []);
  const combined = new Map<string, CustomerStatsRow>();
  for (const customer of imported) {
    const phone = normalisePhone(customer.phone ?? "");
    if (!phone) continue;
    combined.set(phone, {
      name: `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || "Imported customer",
      phone,
      email: customer.email,
      orders: customer.totalOrders ?? 0,
      spend: Math.round(Number(String(customer.totalSpent ?? "0").replace(/[^0-9.]/g, "")) * 100) || 0,
      lastOrder: customer.lastOrderDate,
      source: "imported",
    });
  }
  for (const customer of liveCustomers) {
    const phone = normalisePhone(customer.phone);
    const existing = combined.get(phone);
    if (existing) {
      existing.orders += customer.orders;
      existing.spend += customer.spend;
    } else {
      combined.set(phone, customer);
    }
  }
  return [...combined.values()].sort((a, b) => b.spend - a.spend);
}

export async function getCustomerByPhone(phone: string) {
  const all = await getCombinedCustomerStats();
  return all.find((customer) => customer.phone === normalisePhone(phone)) ?? null;
}

export async function getCustomers() {
  await ensureDatabase();
  await ensureCustomersTable();
  return withDatabaseError(() => db.select().from(customers));
}

export async function getCustomerById(id: number) {
  await ensureDatabase();
  await ensureCustomersTable();
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  if (!row) return null;
  return {
    ...row,
    spend: Math.round(Number(row.spend ?? 0) * 100), // pence for display helpers
    spendPounds: Number(row.spend ?? 0),
  };
}

export async function findCustomerByPhone(phone: string) {
  await ensureCustomersTable();
  const results = await withDatabaseError(() =>
    db
      .select()
      .from(customers)
      .where(
        or(
          eq(customers.phone, phone),
          eq(customers.phone, phone.replace(/^0/, "44")),
          eq(customers.phone, phone.replace(/^0/, "+44")),
        ),
      )
      .limit(1),
  );
  return results[0] ?? null;
}

export async function getRevenue(period: string) {
  await ensureDatabase();
  const rows = await db.select().from(orders);
  const now = new Date();
  const filtered = rows.filter((order) => {
    if (order.status === "cancelled") return false;
    const date = new Date(order.createdAt);
    switch (period) {
      case "month":
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case "year":
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
  return filtered.reduce((sum, order) => sum + order.subtotalPence, 0) / 100;
}
