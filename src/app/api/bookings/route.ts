import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { bookings } from "@/db/schema";
import { toBookingView } from "@/lib/admin-data";
import { bookingCustomerEmail, bookingRestaurantEmail, restaurantEmail, sendMail } from "@/lib/email";
import { addDays, bookingTimesFor, londonNow } from "@/lib/hours";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettingsSafe } from "@/lib/settings";
import { firstError, nameSchema, optionalEmailSchema, phoneSchema, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const bookingSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time"),
  partySize: z.number().int().min(1, "Please choose the number of guests").max(30, "For large groups please call us"),
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  notes: z
    .string()
    .trim()
    .max(500, "Special requests are too long")
    .optional()
    .transform((v) => (v ? v : null)),
  company: z.string().optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`booking:${clientIp(req)}`, 6, 10 * 60_000)) {
    return Response.json({ error: "Too many requests. Please call us to book." }, { status: 429 });
  }
  const parsed = bookingSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  const { company, ...input } = parsed.data;
  if (company) return Response.json({ error: "Unable to process this request." }, { status: 400 });

  const settings = await getSettingsSafe();
  const today = londonNow().date;
  if (input.date > addDays(today, 90) || !bookingTimesFor(input.date, settings.closedDates).includes(input.time)) {
    return Response.json(
      { error: "Sorry, that date and time isn't available online. Please choose another time or call us." },
      { status: 422 },
    );
  }

  try {
    await ensureDatabase();
    const [row] = await db.insert(bookings).values(input).returning();
    const booking = toBookingView(row);
    after(async () => {
      try {
        const to = restaurantEmail(settings);
        const mail = bookingRestaurantEmail(booking);
        if (to) await sendMail({ to, ...mail, replyTo: booking.email });
        else console.info(`[email:no-recipient] ${mail.subject}\n${mail.text}`);
        if (booking.email) await sendMail({ to: booking.email, ...bookingCustomerEmail(booking, "received") });
      } catch (error) {
        console.error("[bookings] notification failed", error);
      }
    });
    return Response.json({ ok: true, id: booking.id }, { status: 201 });
  } catch (error) {
    console.error("[bookings] failed", error);
    return Response.json({ error: "Sorry, something went wrong. Please call us to book." }, { status: 500 });
  }
}
