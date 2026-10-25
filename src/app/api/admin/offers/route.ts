import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { offers } from "@/db/schema";
import { adminGuard } from "@/lib/auth";
import { isValidDateString } from "@/lib/hours";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const date = z.string().refine(isValidDateString, "Enter valid start and end dates");
const link = z.string().trim().min(1).max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}, "Use a site path or a valid http/https link");
const imageData = z.string().max(2_800_000).nullable().optional().refine(
  (value) => !value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value),
  "Upload a PNG, JPEG, or WebP image smaller than 2 MB",
);
const content = z.object({
  title: z.string().trim().min(1, "Enter an offer title").max(120),
  description: z.string().trim().max(1200).default(""),
  ctaText: z.string().trim().min(1, "Enter CTA button text").max(40),
  ctaLink: link,
  imageData,
  startsOn: date,
  endsOn: date,
  displayOrder: z.number().int().min(0).max(10000),
  enabled: z.boolean(),
}).refine((value) => value.endsOn >= value.startsOn, { message: "End date must be on or after the start date", path: ["endsOn"] });
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), ...content.shape }),
  z.object({ action: z.literal("update"), id: z.number().int().positive(), ...content.shape }),
  z.object({ action: z.literal("toggle"), id: z.number().int().positive(), enabled: z.boolean() }),
  z.object({ action: z.literal("delete"), id: z.number().int().positive() }),
]);

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid offer" }, { status: 400 });

  const input = parsed.data;
  if ((input.action === "create" || input.action === "update") && input.endsOn < input.startsOn) {
    return Response.json({ error: "End date must be on or after the start date" }, { status: 400 });
  }

  try {
    await ensureDatabase();
    if (input.action === "create") {
      const [created] = await db.insert(offers).values({
        title: input.title,
        description: input.description,
        ctaText: input.ctaText,
        ctaLink: input.ctaLink,
        imageData: input.imageData || null,
        startsOn: input.startsOn,
        endsOn: input.endsOn,
        displayOrder: input.displayOrder,
        enabled: input.enabled,
      }).returning({ id: offers.id });
      revalidatePath("/admin/marketing");
      revalidatePath("/");
      return Response.json({ ok: true, id: created.id });
    }
    if (input.action === "update") {
      const { id, action: _action, ...values } = input;
      await db.update(offers).set({
        title: values.title,
        description: values.description,
        ctaText: values.ctaText,
        ctaLink: values.ctaLink,
        imageData: values.imageData || null,
        startsOn: values.startsOn,
        endsOn: values.endsOn,
        displayOrder: values.displayOrder,
        enabled: values.enabled,
        updatedAt: new Date(),
      }).where(eq(offers.id, id));
      revalidatePath("/admin/marketing");
      revalidatePath("/");
      return Response.json({ ok: true });
    }
    if (input.action === "toggle") {
      await db.update(offers).set({ enabled: input.enabled, updatedAt: new Date() }).where(eq(offers.id, input.id));
      revalidatePath("/admin/marketing");
      revalidatePath("/");
      return Response.json({ ok: true });
    }
    await db.delete(offers).where(eq(offers.id, input.id));
    revalidatePath("/admin/marketing");
    revalidatePath("/");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/offers] save failed", error);
    return Response.json({ error: "Could not save the offer. Please try again." }, { status: 500 });
  }
}
