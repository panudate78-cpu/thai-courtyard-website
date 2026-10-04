import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { contactMessages } from "@/db/schema";
import { adminGuard } from "@/lib/auth";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function messageId(ctx: Ctx) {
  const { id } = await ctx.params;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  const id = await messageId(ctx);
  const parsed = z.object({ read: z.boolean() }).safeParse(await readJson(req));
  if (!id || !parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  await ensureDatabase();
  await db.update(contactMessages).set({ read: parsed.data.read }).where(eq(contactMessages.id, id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await adminGuard();
  if (denied) return denied;
  const id = await messageId(ctx);
  if (!id) return Response.json({ error: "Invalid request" }, { status: 400 });
  await ensureDatabase();
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  return Response.json({ ok: true });
}
