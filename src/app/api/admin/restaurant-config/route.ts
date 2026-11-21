import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { pool } from "@/db";
import { adminGuard } from "@/lib/auth";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  paymentMode: z.enum(["pay_on_collection", "stripe_online", "customer_choice"]),
});

export async function GET() {
  const guard = await adminGuard();
  if (guard) return guard;
  try {
    const { rows } = await pool.query(`SELECT payment_mode, restaurant_name FROM restaurant_config WHERE id=1`);
    const row = rows[0] as Record<string, unknown> | undefined;
    const mode = typeof row?.payment_mode === "string" ? row.payment_mode : "pay_on_collection";
    return NextResponse.json({ paymentMode: mode, raw: row ?? null });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await adminGuard();
  if (guard) return guard;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payment mode" }, { status: 400 });

  const { paymentMode } = parsed.data;
  if (paymentMode !== "pay_on_collection") {
    const { validateStripeForMode } = await import("@/lib/stripe");
    const v = await validateStripeForMode(paymentMode);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  }

  try {
    await pool.query(`UPDATE restaurant_config SET payment_mode=$1, updated_at=now() WHERE id=1`, [paymentMode]);
    return NextResponse.json({ ok: true, paymentMode });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
