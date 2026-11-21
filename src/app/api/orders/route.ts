import { after } from "next/server";
import { z } from "zod";
import { createOrder, createStripeCheckoutSession, OrderError, sendOrderNotifications } from "@/lib/orders";
import { getRestaurantConfig } from "@/lib/restaurant";
import { validateStripeForMode } from "@/lib/stripe";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { firstError, nameSchema, optionalEmailSchema, phoneSchema, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.number().int().positive(),
        quantity: z.number().int().min(1, "Invalid quantity").max(50, "Maximum 50 of any one dish"),
        choiceIds: z.array(z.number().int().positive()).max(20),
      }),
    )
    .min(1, "Your basket is empty")
    .max(60, "That\'s a big order! Please call us to place it."),
  collectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a collection day"),
  collectionTime: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a collection time"),
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  instructions: z
    .string()
    .trim()
    .max(600, "Special instructions are too long")
    .optional()
    .transform((v) => (v ? v : null)),
  company: z.string().optional(),
  paymentMethod: z.enum(["pay_on_collection", "stripe_online"]).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 10, 10 * 60_000)) {
    return Response.json(
      { error: "Too many orders in a short time. Please call us to complete your order." },
      { status: 429 },
    );
  }
  const parsed = orderSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { company, paymentMethod: clientPaymentMethod, ...input } = parsed.data;
  if (company) return Response.json({ error: "Unable to process this order." }, { status: 400 });

  // Determine effective payment mode from restaurant config (DB-driven, defaults to pay_on_collection)
  let effectivePaymentMode: "pay_on_collection" | "stripe_online" = "pay_on_collection";
  try {
    const cfg = await getRestaurantConfig();
    const mode = cfg.paymentMode;
    if (mode === "stripe_online") effectivePaymentMode = "stripe_online";
    else if (mode === "customer_choice") {
      // Client chooses; default to pay_on_collection if not specified
      effectivePaymentMode = clientPaymentMethod === "stripe_online" ? "stripe_online" : "pay_on_collection";
    } else {
      effectivePaymentMode = "pay_on_collection";
    }
  } catch {
    effectivePaymentMode = "pay_on_collection";
  }

  // If Stripe is required, validate env early with a helpful error (keeps pay_on_collection zero-Stripe)
  if (effectivePaymentMode === "stripe_online") {
    const v = await validateStripeForMode(effectivePaymentMode);
    if (!v.ok) return Response.json({ error: v.error }, { status: 503 });
    // For Stripe online we also require an email for the receipt
    if (!input.email) return Response.json({ error: "Email is required for online payment — we send your receipt there." }, { status: 400 });
  }

  try {
    if (effectivePaymentMode === "stripe_online") {
      // Create pending unpaid order (no kitchen email yet), then Stripe Checkout Session
      const { order, settings } = await createOrder(input, { paymentMethod: "stripe_online" });
      const origin = new URL(req.url).origin;
      const { url } = await createStripeCheckoutSession(order, origin);
      // Do NOT send kitchen/customer emails here — webhook confirms payment first
      // Return checkout URL for the client to redirect to Stripe
      return Response.json({ publicId: order.publicId, orderNumber: order.number, checkoutUrl: url, paymentMethod: "stripe_online" as const }, { status: 201 });
    }

    // Default: pay_on_collection instant confirmation (zero Stripe calls)
    const { order, settings } = await createOrder({ ...input }, { paymentMethod: "pay_on_collection" });
    after(async () => {
      try {
        await sendOrderNotifications(order, settings);
      } catch (error) {
        console.error("[orders] notification failed", error);
      }
    });
    return Response.json({ publicId: order.publicId, orderNumber: order.number, paymentMethod: "pay_on_collection" as const }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) return Response.json({ error: error.message }, { status: error.status });
    console.error("[orders] failed to create order", error);
    return Response.json(
      { error: "Sorry, something went wrong placing your order. Please try again or call us." },
      { status: 500 },
    );
  }
}
