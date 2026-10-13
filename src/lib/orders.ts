import crypto from "node:crypto";
import { asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import {
  orderItems,
  orders,
  gloriaFoodCustomers,
} from "@/db/schema";
import {
  orderCustomerEmail,
  orderReadyEmail,
  orderRestaurantEmail,
  restaurantEmail,
  sendMail,
  type MailResult,
} from "./email";
import { orderNumber } from "./format";
import { isValidCollectionSlot, londonNow } from "./hours";
import { getMenu } from "./menu";
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
};

function toStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value) ? (value as OrderStatus) : "new";
}

function toView(o: OrderRow, items: OrderItemRow[]): OrderView {
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
    emailStatus: o.emailStatus,
    createdAt: o.createdAt.toISOString(),
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

async function withItems(rows: OrderRow[]): Promise<OrderView[]> {
  if (!rows.length) return [];
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
  return rows.map((r) => toView(r, byOrder.get(r.id) ?? []));
}

/** Validates the basket against the live menu (server-side pricing) and stores the order. */
export async function createOrder(input: OrderInput): Promise<{ order: OrderView; settings: Settings }> {
  const settings = await getSettings();
  if (!settings.orderingEnabled) {
    throw new OrderError(settings.pausedMessage || "Online ordering is currently paused. Please call us to place your order.", 409);
  }
  if (!isValidCollectionSlot(input.collectionDate, input.collectionTime, toSlotConfig(settings))) {
    throw new OrderError("Sorry, that collection time is no longer available. Please choose another time.");
  }

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
      })
      .returning();
    const itemRows = await tx
      .insert(orderItems)
      .values(lines.map((l) => ({ ...l, orderId: row.id })))
      .returning();
    return toView(row, itemRows);
  });

  return { order, settings };
}

export async function sendOrderNotifications(order: OrderView, settings: Settings) {
  const to = restaurantEmail(settings);
  const restaurantMail = orderRestaurantEmail(order);
  let result: MailResult = "logged";
  if (to) {
    result = await sendMail({ to, ...restaurantMail, replyTo: order.email });
  } else {
    console.info(`[email:no-recipient] ${restaurantMail.subject}\n${restaurantMail.text}`);
  }
  if (order.email) await sendMail({ to: order.email, ...orderCustomerEmail(order) });
  await db.update(orders).set({ emailStatus: result }).where(eq(orders.id, order.id));
}

export async function sendOrderReadyEmail(order: OrderView) {
  if (order.email) await sendMail({ to: order.email, ...orderReadyEmail(order) });
}

export async function getOrderByPublicId(publicId: string) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(publicId)) return null;
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
function normalisePhone(phone: string) {
  return phone
    .trim()
    .replace(/\s+/g, "")
    .replace(/[()-]/g, "")
    .replace(/^\+44/, "0");
}

export async function getCustomerStats() {
  const rows = await db
    .select()
    .from(orders);

  const customers = new Map();

  for (const order of rows) {
    const key = normalisePhone(order.phone);

    if (!customers.has(key)) {
      customers.set(key, {
        name: order.customerName,
        phone: normalisePhone(order.phone),
        email: order.email,
        orders: 0,
        spend: 0,
        lastOrder: order.createdAt,
      });
    }

    const customer = customers.get(key);

    customer.orders += 1;
    customer.spend += order.subtotalPence;

    if (order.createdAt > customer.lastOrder) {
      customer.lastOrder = order.createdAt;
    }
  }

  return Array.from(customers.values()).sort(
    (a, b) => b.spend - a.spend
  );
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
  await ensureDatabase();
  const rows = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
  const [view] = await withItems(rows);
  return view ?? null;
}
export async function getCustomerCount() {
  await ensureDatabase();

  const rows = await db.select().from(orders);

  const uniqueCustomers = new Set(
    rows.map((o) => o.phone)
  );

  return uniqueCustomers.size;
}
export async function getCustomerByPhone(phone: string) {
  const customers = await getCustomerStats();

  return customers.find(
    (customer) => customer.phone === phone
  );
}
export async function getGloriaFoodCustomers() {
  return await db
    .select()
    .from(gloriaFoodCustomers);
}