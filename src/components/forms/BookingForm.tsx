"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { addDays, bookingTimesFor, formatDateLong, isValidDateString, parseHours, type HolidayException } from "@/lib/hours";

type Props = {
  today: string;
  closedDates: string[];
  openingHours: Record<string, { open: string; close: string } | null>;
  holidays: HolidayException[];
  phoneDisplay: string;
  hoursSummary: string;
};

const EMPTY = { date: "", time: "", partySize: "2", name: "", phone: "", email: "", notes: "", company: "" };

export function BookingForm({ today, closedDates, openingHours, holidays, phoneDisplay, hoursSummary }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const times = useMemo(
    () => (form.date && isValidDateString(form.date) ? bookingTimesFor(form.date, closedDates, parseHours(openingHours), holidays) : []),
    [form.date, closedDates, openingHours, holidays],
  );
  const update = (patch: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...patch }));

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!form.date) return setError("Please choose a date.");
    if (!form.time) return setError("Please choose a time.");
    setState("sending");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, partySize: Number(form.partySize) }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || `Sorry, something went wrong. Please call us on ${phoneDisplay}.`);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="card flex flex-col items-center p-8 text-center sm:p-12">
        <CalendarCheck className="h-14 w-14 text-gold" aria-hidden="true" />
        <h2 className="mt-4 font-serif text-3xl font-semibold">Thank you, {form.name.split(" ")[0]}!</h2>
        <p className="mt-3 max-w-md leading-relaxed text-charcoal/75">
          Your request for a table for <strong>{form.partySize}</strong> on <strong>{formatDateLong(form.date)}</strong> at{" "}
          <strong>{form.time}</strong> has been sent. We&apos;ll confirm by phone{form.email ? " or email" : ""} shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setState("idle");
          }}
          className="btn btn-outline mt-6"
        >
          Make another booking
        </button>
      </div>
    );
  }

  const closedNotice = form.date && times.length === 0;

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
      <div>
        <h2 className="font-serif text-3xl font-semibold">Reservation request</h2>
        <p className="mt-1 text-sm text-charcoal/65">All fields marked * are required.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="booking-date" className="label">
            Date *
          </label>
          <input
            id="booking-date"
            type="date"
            required
            min={today}
            max={addDays(today, 90)}
            value={form.date}
            onChange={(e) => update({ date: e.target.value, time: "" })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="booking-time" className="label">
            Time *
          </label>
          <select
            id="booking-time"
            required
            disabled={!times.length}
            value={form.time}
            onChange={(e) => update({ time: e.target.value })}
            className="input"
          >
            <option value="">{form.date ? (times.length ? "Select a time" : "Unavailable") : "Choose a date first"}</option>
            {times.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="booking-guests" className="label">
            Guests *
          </label>
          <select id="booking-guests" value={form.partySize} onChange={(e) => update({ partySize: e.target.value })} className="input">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>
      {closedNotice ? (
        <p className="rounded-xl bg-cream-dark p-3 text-sm text-charcoal/75" role="status">
          Sorry, there are no tables available online for that day. We&apos;re open {hoursSummary}. For same-day bookings
          please call {phoneDisplay}.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="booking-name" className="label">
            Name *
          </label>
          <input
            id="booking-name"
            required
            autoComplete="name"
            maxLength={80}
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="booking-phone" className="label">
            Telephone *
          </label>
          <input
            id="booking-phone"
            type="tel"
            required
            autoComplete="tel"
            maxLength={25}
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="booking-email" className="label">
        Email <span aria-hidden="true">*</span>
        </label>
        <input
          id="booking-email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          className="input"
        />
      </div>
      <div>
        <label htmlFor="booking-notes" className="label">
          Special requests <span className="font-normal text-charcoal/50">(optional)</span>
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          maxLength={500}
          placeholder="High chair, celebration, allergies…"
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          className="input resize-y"
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="booking-company">Company</label>
        <input id="booking-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={(e) => update({ company: e.target.value })} />
      </div>
      {error ? (
        <p role="alert" className="rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={state === "sending"} className="btn btn-gold w-full py-4 text-base">
        {state === "sending" ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" /> Sending request…
          </>
        ) : (
          "Request booking"
        )}
      </button>
      <p className="text-center text-xs text-charcoal/55">
        Your booking is confirmed once we&apos;ve been in touch. Need it sooner? Call {phoneDisplay}.
      </p>
    </form>
  );
}
