import type { Metadata } from "next";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { listBookings } from "@/lib/admin-data";
import { londonNow } from "@/lib/hours";

export const metadata: Metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  const bookings = await listBookings();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">Table bookings</h1>
        <p className="text-sm text-black/55">
          Booking requests from the website. Confirm or decline — guests who left an email are notified automatically.
        </p>
      </header>
      <BookingsTable initialBookings={bookings} today={londonNow().date} />
    </div>
  );
}
