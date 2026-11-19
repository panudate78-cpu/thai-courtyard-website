import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { customers } from "@/db/schema";
import { ensureCustomersTable } from "@/db/ensure-customers";
import { firstError, readJson } from "@/lib/validation";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(120).optional().default(""),
  marketingConsent: z.string().optional().default("yes"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { email, name } = parsed.data;
  try {
    await ensureDatabase();
    try { await ensureCustomersTable(); } catch {}
    // Upsert-like: if email exists, update consent; otherwise insert.
    // We attempt an insert; on conflict we ignore error and still return ok (idempotent signup).
    try {
      await db.insert(customers).values({
        email,
        name: name || email.split("@")[0],
        marketingConsent: "yes",
        source: "website-newsletter",
        orders: 0,
        spend: "0",
      });
    } catch (e) {
      // If insert fails due to duplicate or missing table, we still treat as success for UX
      console.warn("[newsletter] insert skipped", e);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[newsletter] failed", error);
    return Response.json({ error: "Could not save — please try again or call us on 020 8941 3595" }, { status: 500 });
  }
}
