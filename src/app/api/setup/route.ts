import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { pool } from "@/db";

export const dynamic = "force-dynamic";

function checkSetupToken(req: NextRequest): boolean {
  const env = process.env.SETUP_TOKEN;
  if (!env) return true;
  const header = req.headers.get("x-setup-token") || "";
  const urlToken = req.nextUrl.searchParams.get("token") || "";
  const bodyToken = (req as unknown as { token?: string })?.token;
  return header === env || urlToken === env || bodyToken === env;
}

// Read JSON body safely
async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

const step1Schema = z.object({
  step: z.literal(1),
  restaurantName: z.string().min(1).max(100),
  fullName: z.string().max(120).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  shortDescription: z.string().max(500).optional(),
  addressStreet: z.string().max(200).optional(),
  addressLocality: z.string().max(100).optional(),
  addressRegion: z.string().max(100).optional(),
  addressPostcode: z.string().max(20).optional(),
  phoneDisplay: z.string().max(30).optional(),
  phoneIntl: z.string().max(30).optional(),
  email: z.string().email().max(200).optional(),
  deliverooUrl: z.string().max(500).optional(),
  googlePlaceId: z.string().max(200).optional(),
  googleReviewUrl: z.string().max(500).optional(),
  themePrimary: z.string().max(20).optional(),
  themeAccent: z.string().max(20).optional(),
  fontPreset: z.string().max(30).optional(),
  siteUrl: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const envToken = process.env.SETUP_TOKEN;
  const body = await readBody(req);
  const tokenFromBody = typeof body.token === "string" ? body.token : undefined;
  const headerToken = req.headers.get("x-setup-token") || "";
  const urlToken = req.nextUrl.searchParams.get("token") || "";
  if (envToken && !(headerToken === envToken || urlToken === envToken || tokenFromBody === envToken)) {
    return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });
  }

  // Check if already completed and no token — lock
  try {
    const { rows } = await pool.query(`SELECT setup_completed FROM restaurant_config WHERE id=1`);
    if (rows[0]?.setup_completed === true && !envToken) {
      // Allow re-entry if admin is logged in? For now, allow overwriting but warn
    }
  } catch {}

  const step = body.step as number | undefined;

  try {
    if (step === 1) {
      const data = step1Schema.parse(body);
      await pool.query(
        `UPDATE restaurant_config SET
          restaurant_name=$1, full_name=$2, tagline=$3, description=$4, short_description=$5,
          address_street=$6, address_locality=$7, address_region=$8, address_postcode=$9,
          phone_display=$10, phone_intl=$11, email=$12, deliveroo_url=$13, google_place_id=$14, google_review_url=$15,
          theme_primary=$16, theme_accent=$17, font_preset=$18, site_url=$19, updated_at=now()
        WHERE id=1`,
        [
          data.restaurantName,
          data.fullName || data.restaurantName,
          data.tagline || "",
          data.description || "",
          data.shortDescription || "",
          data.addressStreet || "105 Walton Road",
          data.addressLocality || "East Molesey",
          data.addressRegion || "Surrey",
          data.addressPostcode || "KT8 0DR",
          data.phoneDisplay || "020 8941 3595",
          data.phoneIntl || "+44 20 8941 3595",
          data.email || "info@example.co.uk",
          data.deliverooUrl || "",
          data.googlePlaceId || "",
          data.googleReviewUrl || "",
          data.themePrimary || "#1a2a3a",
          data.themeAccent || "#c9a86a",
          data.fontPreset || "serif-sans",
          (data.siteUrl || "https://example.co.uk").replace(/\/$/, ""),
        ],
      );
      return NextResponse.json({ ok: true });
    }

    if (step === 2) {
      const openingHours = body.openingHours as Record<string, unknown> | undefined;
      const slotIntervalMinutes = Number(body.slotIntervalMinutes) || 15;
      const leadTimeMinutes = Number(body.leadTimeMinutes) || 20;
      const maxDaysAhead = Number(body.maxDaysAhead) || 7;
      const paymentNotice = typeof body.paymentNotice === "string" ? body.paymentNotice : "";
      const announcement = typeof body.announcement === "string" ? body.announcement : null;
      const rawMode = typeof body.paymentMode === "string" ? (body.paymentMode as string) : "pay_on_collection";
      const paymentMode = ["pay_on_collection", "stripe_online", "customer_choice"].includes(rawMode) ? rawMode : "pay_on_collection";
      // Validate Stripe when online payments are enabled — keep pay_on_collection completely optional
      if (paymentMode !== "pay_on_collection") {
        const { validateStripeForMode } = await import("@/lib/stripe");
        const v = await validateStripeForMode(paymentMode);
        if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
      }
      await pool.query(
        `UPDATE restaurant_config SET opening_hours=$1::jsonb, slot_interval_minutes=$2, lead_time_minutes=$3, max_days_ahead=$4, payment_notice=$5, announcement=$6, payment_mode=$7, updated_at=now() WHERE id=1`,
        [JSON.stringify(openingHours || {}), slotIntervalMinutes, leadTimeMinutes, maxDaysAhead, paymentNotice, announcement, paymentMode],
      );
      // Also keep site_settings in sync (legacy)
      await pool.query(
        `UPDATE site_settings SET slot_interval_minutes=$1, lead_time_minutes=$2, max_days_ahead=$3, announcement=$4, updated_at=now() WHERE id=1`,
        [slotIntervalMinutes, leadTimeMinutes, maxDaysAhead, announcement],
      ).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (step === 3) {
      const areaServed = Array.isArray(body.areaServed) ? (body.areaServed as string[]).slice(0, 30) : [];
      await pool.query(`UPDATE restaurant_config SET area_served=$1::text[], updated_at=now() WHERE id=1`, [areaServed]);
      return NextResponse.json({ ok: true });
    }

    if (step === 4) {
      // Menu upload — body contains menuPayload (CSV or JSON string) and parsed
      const menuPayload = typeof body.menuPayload === "string" ? body.menuPayload : "";
      if (!menuPayload.trim()) return NextResponse.json({ error: "No menu data" }, { status: 400 });
      // We delegate heavy lifting to a helper that parses CSV/JSON and replaces menu.
      // For now, store raw payload in a temp table or just return — actual replacement is done via /api/setup/menu
      // To keep wizard simple, we handle both here: try to process menu in this same request.
      const { processMenuPayload } = await import("@/lib/setup-menu");
      const result = await processMenuPayload(menuPayload);
      return NextResponse.json({ ok: true, result });
    }

    if (step === 5) {
      const logoUrl = typeof body.logoUrl === "string" ? body.logoUrl : "/images/logo.png";
      const heroImageUrl = typeof body.heroImageUrl === "string" ? body.heroImageUrl : "/images/hero-spread.jpg";
      const ogImageUrl = typeof body.ogImageUrl === "string" ? body.ogImageUrl : "/opengraph-image";
      const galleryUrls = Array.isArray(body.galleryUrls) ? (body.galleryUrls as string[]) : [];
      await pool.query(
        `UPDATE restaurant_config SET logo_url=$1, hero_image_url=$2, og_image_url=$3, gallery_urls=$4::text[], updated_at=now() WHERE id=1`,
        [logoUrl, heroImageUrl, ogImageUrl, galleryUrls],
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  } catch (e) {
    console.error("[setup] error", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Setup save failed" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  if (!checkSetupToken(req)) return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });
  try {
    const { rows } = await pool.query(`SELECT * FROM restaurant_config WHERE id=1`);
    return NextResponse.json({ config: rows[0] || null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
