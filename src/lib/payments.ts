import type { RestaurantConfig } from "./restaurant";

/**
 * Payments architecture.
 *
 * Stripe checkout is intentionally NOT wired up yet. The platform stores
 * payment configuration (Admin → Settings → Payments) so online payment
 * can be switched on later without a data migration:
 *
 * - `restaurant_profile.pay_on_collection`    — pay in restaurant (live today)
 * - `restaurant_profile.pay_online_enabled`   — shows "Pay Online" at checkout
 * - `restaurant_profile.stripe_publishable_key` — safe to expose to the browser
 * - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — environment only, never in the DB
 * - `orders.payment_method` / `orders.payment_status` — recorded on every order
 *
 * To complete Stripe later: create a Checkout Session server-side in
 * POST /api/orders when paymentMethod=pay_online, store the session id,
 * and confirm via webhook before marking payment_status='paid'.
 * See docs/architecture.md → "Payments roadmap".
 */

export const PAYMENT_METHODS = ["pay_on_collection", "pay_online"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentOption = {
  id: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  badge?: string;
};

export function paymentOptions(config: Pick<RestaurantConfig, "payments">): PaymentOption[] {
  const options: PaymentOption[] = [];
  if (config.payments.payOnCollection) {
    options.push({
      id: "pay_on_collection",
      label: "Pay on Collection",
      description: "Pay in the restaurant by cash or card when you collect.",
      available: true,
    });
  }
  options.push({
    id: "pay_online",
    label: "Pay Online",
    description: config.payments.payOnlineEnabled
      ? "Pay securely online by card."
      : "Card payment online via Stripe.",
    // Checkout is not implemented yet — never mark available until the
    // server route creates a real Checkout Session.
    available: false,
    badge: "Stripe — Coming Soon",
  });
  return options;
}

export function isStripeConfigured(config: Pick<RestaurantConfig, "payments">) {
  return Boolean(config.payments.stripePublishableKey) && Boolean(process.env.STRIPE_SECRET_KEY);
}
