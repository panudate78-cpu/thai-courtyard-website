/**
 * Optional Stripe helper — keeps build green when STRIPE_* env vars are unset.
 * Stripe is only required when restaurant_config.payment_mode !== "pay_on_collection".
 * All functions return null / throw with a clear message if Stripe is not configured,
 * so the default pay-on-collection flow never touches Stripe.
 */

export type StripeEnvStatus = {
  configured: boolean;
  hasSecret: boolean;
  hasPublishable: boolean;
  hasWebhookSecret: boolean;
  hint: string | null;
};

export function getStripeEnvStatus(): StripeEnvStatus {
  const hasSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasPublishable = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY);
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const configured = hasSecret && hasPublishable;
  let hint: string | null = null;
  if (!hasSecret || !hasPublishable) {
    hint = "Stripe not configured — set STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (and STRIPE_WEBHOOK_SECRET for webhooks). Pay on collection remains the default.";
  } else if (!hasWebhookSecret) {
    hint = "STRIPE_WEBHOOK_SECRET missing — webhook verification will fail until set (Stripe Dashboard → Webhooks → Signing secret).";
  }
  return { configured, hasSecret, hasPublishable, hasWebhookSecret, hint };
}

export function isStripeConfigured(): boolean {
  return getStripeEnvStatus().configured;
}

/**
 * Lazily load the Stripe SDK only when needed.
 * Returns null if stripe is not installed or env not configured.
 */
export async function getStripe() {
  const { hasSecret } = getStripeEnvStatus();
  if (!hasSecret) return null;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });
    return stripe;
  } catch (e) {
    console.warn("[stripe] Failed to load stripe SDK", e);
    return null;
  }
}

/**
 * Validate Stripe env when a restaurant has enabled online payments.
 * Call from /setup and /admin before saving payment_mode that requires Stripe.
 */
export async function validateStripeForMode(paymentMode: string): Promise<{ ok: boolean; error?: string }> {
  if (paymentMode === "pay_on_collection") return { ok: true };
  const status = getStripeEnvStatus();
  if (!status.configured) {
    return {
      ok: false,
      error: "Stripe keys missing — set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in env (Vercel + .env.local). Keeping pay_on_collection until configured.",
    };
  }
  // Optional live ping: try to list a balance or retrieve account if secret looks valid
  // We avoid a real API call during build; just check key prefix.
  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key.startsWith("sk_")) {
    return { ok: false, error: "STRIPE_SECRET_KEY looks invalid — expected sk_live_… or sk_test_…" };
  }
  // Light verification: try to call Stripe if available, but don't fail build if network unavailable
  try {
    const stripe = await getStripe();
    if (stripe) await stripe.accounts.retrieve().catch(() => {});
  } catch {}
  return { ok: true };
}
