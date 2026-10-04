import { eq } from "drizzle-orm";
import { after } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { ensureDatabase } from "@/db/bootstrap";
import { bookings } from "@/db/schema";
import { toBookingView } from "@/lib/admin-data";
import { adminGuard } from "@/lib/auth";
import { bookingCustomerEmail, sendMail } from "@/lib/email";
import { BOOKING_STATUSES } from "@/lib/types";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

const schema = z.object({ status: z.enum(BOOKING_STATUSES) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) return Response.json({ error: "Invalid booking" }, { status: 400 });
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });

  await ensureDatabase();
  const [row] = await db.update(bookings).set({ status: parsed.data.status }).where(eq(bookings.id, bookingId)).returning();
  if (!row) return Response.json({ error: "Booking not found" }, { status: 404 });
  const booking = toBookingView(row);
  const status = parsed.data.status;
  const email = booking.email;
  if (email && (status === "confirmed" || status === "declined")) {
    after(async () => {
      try {
        await sendMail({ to: email, ...bookingCustomerEmail(booking, status) });
      } catch (error) {
        console.error("[bookings] customer email failed", error);
      }
    });
  }
  return Response.json({ booking });
}
