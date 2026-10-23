"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Check, Mail, Phone, Users, X } from "lucide-react";
import { formatDateLong, relativeDayLabel } from "@/lib/hours";
import type { BookingStatus, BookingView } from "@/lib/types";
import { Notice, useNotice } from "./AdminUI";

type Tab = "upcoming" | "pending" | "past" | "all";

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  declined: "bg-red-100 text-red-800",
  cancelled: "bg-black/10 text-black/60",
};

export function BookingsTable({ initialBookings, today }: { initialBookings: BookingView[]; today: string }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialBookings);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useNotice();

  async function setStatus(booking: BookingView, status: BookingStatus) {
    if ((status === "declined" || status === "cancelled") && !window.confirm(`Mark ${booking.name}'s booking as ${status}?`)) return;
    setBusyId(booking.id);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { booking?: BookingView; error?: string };
      const updated = data.booking;
      if (!res.ok || !updated) throw new Error(data.error || "Could not update booking");
      setRows((prev) => prev.map((r) => (r.id === booking.id ? updated : r)));
      setNotice({ type: "ok", text: `Booking ${status}` });
      router.refresh();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Could not update booking" });
    } finally {
      setBusyId(null);
    }
  }

  const sortKey = (b: BookingView) => `${b.date} ${b.time}`;
  const filtered = rows
    .filter((b) => {
      if (tab === "pending") return b.status === "pending";
      if (tab === "upcoming") return b.date >= today && (b.status === "pending" || b.status === "confirmed");
      if (tab === "past") return b.date < today;
      return true;
    })
    .sort((a, b) => (tab === "past" || tab === "all" ? sortKey(b).localeCompare(sortKey(a)) : sortKey(a).localeCompare(sortKey(b))));

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: rows.filter((b) => b.date >= today && (b.status === "pending" || b.status === "confirmed")).length },
    { id: "pending", label: "Awaiting confirmation", count: rows.filter((b) => b.status === "pending").length },
    { id: "past", label: "Past", count: rows.filter((b) => b.date < today).length },
    { id: "all", label: "All", count: rows.length },
  ];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5" role="group" aria-label="Filter bookings">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap ${
              tab === t.id ? "bg-charcoal text-cream" : "text-black/70 hover:bg-black/5"
            }`}
          >
            {t.label}
            {t.count ? <span className="ml-1.5 text-xs opacity-70">{t.count}</span> : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="adm-card flex flex-col items-center p-10 text-center text-black/50">
          <CalendarX className="h-10 w-10" aria-hidden="true" />
          <p className="mt-3 font-medium">No bookings to show.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((b) => {
            const busy = busyId === b.id;
            return (
              <article key={b.id} className="adm-card flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">
                      {relativeDayLabel(b.date, today)} · {b.time}
                    </p>
                    <p className="text-xs text-black/50">{formatDateLong(b.date)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4 text-gold-deep" aria-hidden="true" />
                  {b.partySize} {b.partySize === 1 ? "guest" : "guests"} · {b.name}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-black/65">
                  <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {b.phone}
                  </a>
                  {b.email ? (
                    <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1 break-all hover:underline">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {b.email}
                    </a>
                  ) : null}
                </p>
                {b.notes ? <p className="mt-3 rounded-xl bg-black/[0.03] p-3 text-sm">{b.notes}</p> : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {b.status !== "confirmed" ? (
                    <button type="button" className="adm-btn-primary flex-1" disabled={busy} onClick={() => setStatus(b, "confirmed")}>
                      <Check aria-hidden="true" /> Confirm
                    </button>
                  ) : null}
                  {b.status === "pending" ? (
                    <button type="button" className="adm-btn-danger" disabled={busy} onClick={() => setStatus(b, "declined")}>
                      <X aria-hidden="true" /> Decline
                    </button>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <button type="button" className="adm-btn flex-1" disabled={busy} onClick={() => setStatus(b, "cancelled")}>
                      <X aria-hidden="true" /> Cancel booking
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
