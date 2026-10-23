import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { contactMessages } from "@/db/schema";
import { contactRestaurantEmail, restaurantEmail, sendMail, setEmailBrand } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettingsSafe } from "@/lib/settings";
import { getRestaurantConfigSafe } from "@/lib/restaurant";
import { firstError, nameSchema, optionalPhoneSchema, readJson, requiredEmailSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: nameSchema,
  email: requiredEmailSchema,
  phone: optionalPhoneSchema,
  message: z
    .string()
    .trim()
    .min(10, "Please enter a message of at least 10 characters")
    .max(2000, "Your message is too long"),
  company: z.string().optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000)) {
    return Response.json({ error: "Too many messages. Please try again later or call us." }, { status: 429 });
  }
  const parsed = contactSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { company, ...input } = parsed.data;
  if (company) return Response.json({ error: "Unable to send this message." }, { status: 400 });

  try {
    await ensureDatabase();
    await db.insert(contactMessages).values(input);
    const settings = await getSettingsSafe();
    after(async () => {
      try {
        const config = await getRestaurantConfigSafe();
        setEmailBrand(config.name);
        const to = restaurantEmail(settings, config);
        const mail = contactRestaurantEmail(input, config);
        if (to) await sendMail({ to, ...mail, replyTo: input.email });
        else console.info(`[email:no-recipient] ${mail.subject}\n${mail.text}`);
      } catch (error) {
        console.error("[contact] notification failed", error);
      }
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("[contact] failed", error);
    return Response.json({ error: "Sorry, your message could not be sent. Please call us." }, { status: 500 });
  }
}
