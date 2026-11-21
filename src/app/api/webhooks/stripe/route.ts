import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { orders } from "@/db/schema";
import { getRestaurantConfig } from "@/lib/restaurant";
import { getStripe, getStripeEnvStatus } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { sendOrderNotifications, getOrderByPublicId } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook — verifies checkout.session.completed and confirms the order.
 * Only then are kitchen/restaurant emails sent, so abandoned checkouts don't spam the kitchen.
 *
 * Configure in Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   https://www.example.co.uk/api/webhooks/stripe
 *   Events: checkout.session.completed
 *   Secret: STRIPE_WEBHOOK_SECRET (whsec_…)
 */

export async function POST(req: Request) {
  const status = getStripeEnvStatus();
  // If Stripe not configured but payment_mode is pay_on_collection, webhook is just not used — return 200 so Stripe doesn't retry
  if (!status.hasSecret) {
    return Response.json({ received: true, note: "Stripe not configured — ignoring webhook (pay_on_collection mode)" });
  }

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: { type: string; data: { object: Record<string, unknown> } };
  const rawBody = await req.text();

  if (webhookSecret && sig) {
    const stripe = await getStripe();
    if (!stripe) return Response.json({ error: "Stripe not available" }, { status: 500 });
    try {
      const constructed = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      event = constructed as unknown as typeof event;
    } catch (e) {
      console.error("[stripe webhook] signature verification failed", e);
      return Response.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }
  } else {
    // Fallback: no secret configured — parse JSON directly (useful for local testing with `stripe trigger`)
    // Log a warning but still process if the event looks legit
    if (webhookSecret && !sig) {
      console.warn("[stripe webhook] missing stripe-signature header but webhook secret is set");
      return Response.json({ error: "Missing stripe-signature" }, { status: 400 });
    }
    try {
      event = JSON.parse(rawBody) as typeof event;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    console.warn("[stripe webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification (set it for production)");
  }

  // Only care about completed checkouts
  if (event.type !== "checkout.session.completed") {
    return Response.json({ received: true, type: event.type });
  }

  const session = event.data.object as {
    id: string;
    payment_status?: string;
    payment_intent?: string;
    client_reference_id?: string | null;
    metadata?: Record<string, string>;
    customer_email?: string | null;
  };

  // Stripe marks paid sessions as payment_status === 'paid' (or 'no_payment_required')
  const paidStatuses = new Set(["paid", "no_payment_required"]);
  if (session.payment_status && !paidStatuses.has(session.payment_status)) {
    console.warn("[stripe webhook] checkout session not paid", session.id, session.payment_status);
    return Response.json({ received: true, note: "session not paid" });
  }

  const sessionId = session.id;
  const publicIdFromMetadata = session.metadata?.orderPublicId || session.client_reference_id || null;

  try {
    await ensureDatabase();

    // Find order by stripe_session_id first, then fallback to publicId metadata
    let orderRows = await db.select().from(orders).where(eq(orders.stripeSessionId, sessionId)).limit(1);
    if (!orderRows.length && publicIdFromMetadata) {
      orderRows = await db.select().from(orders).where(eq(orders.publicId, publicIdFromMetadata)).limit(1);
      // If found via publicId, also set the session id for future idempotency
      if (orderRows.length && !orderRows[0].stripeSessionId) {
        await db.update(orders).set({ stripeSessionId: sessionId, updatedAt: new Date() }).where(eq(orders.id, orderRows[0].id));
        orderRows[0].stripeSessionId = sessionId;
      }
    }

    if (!orderRows.length) {
      console.error("[stripe webhook] order not found for session", sessionId, publicIdFromMetadata);
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const orderRow = orderRows[0];
    const alreadyPaid = orderRow.paymentStatus === "paid";
    if (alreadyPaid) {
      return Response.json({ received: true, alreadyPaid: true });
    }

    // Mark paid — this also powers admin payment badge and prevents double-email
    const updated = await db
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(orders.id, orderRow.id))
      .returning();
    const updatedRow = updated[0];
    if (!updatedRow) return Response.json({ error: "Failed to update order" }, { status: 500 });

    // Fetch full OrderView with items for email
    const orderView = await getOrderByPublicId(orderRow.publicId);
    if (!orderView) {
      console.error("[stripe webhook] failed to load order view", orderRow.publicId);
      return Response.json({ received: true, note: "order view missing" });
    }
    // Ensure view reflects paid status (getOrderByPublicId reads from DB after update, so it will be paid)
    const settings = await getSettings().catch(() => null);
    // Send restaurant + customer emails now that payment is verified
    const toSend = { ...orderView, paymentStatus: "paid" as const, paidAt: new Date().toISOString(), paymentMethod: "stripe_online" as const };
    // Use after() so webhook responds quickly but email still sent
    after(async () => {
      try {
        const cfg = await getRestaurantConfig().catch(() => null);
        const restaurantEmail = cfg?.paymentMode; // just to ensure config loaded
        const { sendOrderNotifications } = await import("@/lib/orders");
        const settingsForMail = settings || (await getSettings().catch(() => null as unknown as typeof settings));
        if (settingsForMail) {
          await sendOrderNotifications(toSend as unknown as Parameters<typeof sendOrderNotifications>[0], settingsForMail);
        }
        console.info(`[stripe webhook] order #${toSend.number} confirmed and emails sent (session ${sessionId})`);
      } catch (e) {
        console.error("[stripe webhook] sendOrderNotifications failed", e);
      }
    });

    return Response.json({ received: true, paid: true, orderPublicId: orderRow.publicId });
  } catch (e) {
    console.error("[stripe webhook] handler error", e);
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// Stripe sends POST only; respond 405 for other methods
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
