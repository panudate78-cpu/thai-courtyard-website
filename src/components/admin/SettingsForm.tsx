"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import {
  formatPausedUntilLabel,
  formatDateLong,
  isPausedUntilActive,
  isValidDateString,
  londonNow,
  fromMinutes,
} from "@/lib/hours";
import type { Settings } from "@/lib/types";
import { Notice, Toggle, useNotice } from "./AdminUI";

type Props = { initial: Settings; provider: "resend" | "smtp" | null; envRecipient: string | null };

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="adm-card grid gap-5 p-5 md:grid-cols-[260px_minmax(0,1fr)] md:p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-black/55">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial, provider, envRecipient }: Props) {
  const router = useRouter();
  const [orderingEnabled, setOrderingEnabled] = useState(initial.orderingEnabled);
  const [pausedMessage, setPausedMessage] = useState(initial.pausedMessage ?? "");
  const [pausedUntil, setPausedUntil] = useState(initial.orderingPausedUntil ?? "");
  const [leadTime, setLeadTime] = useState(initial.leadTimeMinutes);
  const [interval, setInterval] = useState(initial.slotIntervalMinutes);
  const [daysAhead, setDaysAhead] = useState(initial.maxDaysAhead);
  const [closedDates, setClosedDates] = useState<string[]>(initial.closedDates);
  const [newDate, setNewDate] = useState("");
  const [notificationEmail, setNotificationEmail] = useState(initial.notificationEmail ?? "");
  const [announcement, setAnnouncement] = useState(initial.announcement ?? "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useNotice();

  const now = londonNow();
  const today = now.date;
  const pauseActive = pausedUntil ? isPausedUntilActive(pausedUntil, now) : false;
  const effectivePaused = !orderingEnabled || pauseActive;
  // An expired "pause until" is inert, so don't show it in the inputs.
  const activePausedUntil = pauseActive ? pausedUntil : "";
  const [pauseDate, pauseTime] = activePausedUntil.split("T");

  function addClosedDate() {
    if (!isValidDateString(newDate) || closedDates.includes(newDate)) return;
    setClosedDates((d) => [...d, newDate].sort());
    setNewDate("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      if (pausedUntil && !isPausedUntilActive(pausedUntil)) {
        throw new Error("Choose a date and time in the future.");
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderingEnabled,
          pausedMessage: pausedMessage.trim() || null,
          orderingPausedUntil: pausedUntil || null,
          leadTimeMinutes: leadTime,
          slotIntervalMinutes: interval,
          maxDaysAhead: daysAhead,
          closedDates,
          notificationEmail: notificationEmail.trim() || null,
          announcement: announcement.trim() || null,
        }),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save settings");
      setNotice({ type: "ok", text: "Settings saved" });
      router.refresh();
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Could not save settings" });
    } finally {
      setSaving(false);
    }
  }

  const recipient = notificationEmail.trim() || envRecipient;

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Online ordering" description="Pause collection ordering when the kitchen is too busy or closed unexpectedly.">
        <div className="flex items-center gap-3">
          <Toggle checked={orderingEnabled} onChange={setOrderingEnabled} label="Accept online collection orders" />
          <span className={`text-sm font-semibold ${effectivePaused ? "text-red-700" : "text-emerald-700"}`}>
            {!orderingEnabled
              ? "Online ordering paused"
              : pauseActive
              ? `Paused until ${formatPausedUntilLabel(pausedUntil)} — resumes automatically`
              : "Accepting online orders"}
          </span>
        </div>
        <p className={`mt-0.5 text-sm ${effectivePaused ? "text-red-700" : "text-black/50"}`}>
          {!orderingEnabled
            ? "Switch the toggle back on to accept orders again."
            : pauseActive
            ? "Ordering switches back on automatically at the time above."
            : "Customers can place collection orders through the website."}
        </p>

        <div>
          <label htmlFor="paused-until" className="adm-label">
            Pause online ordering until
          </label>
          <div className="flex flex-wrap gap-2 items-end">
            <label htmlFor="paused-date" className="sr-only">
              Pause date
            </label>
            <input
              id="paused-date"
              type="date"
              min={today}
              value={pauseDate ?? ""}
              onChange={(e) =>
                setPausedUntil(e.target.value && pauseTime ? `${e.target.value}T${pauseTime}` : "")
              }
              className="adm-input w-auto"
            />
            <label htmlFor="paused-time" className="sr-only">
              Pause time
            </label>
            <input
              id="paused-time"
              type="time"
              min={pauseDate === today ? fromMinutes(now.minutes) : undefined}
              value={pauseTime ?? ""}
              onChange={(e) =>
                setPausedUntil(pauseDate ? `${pauseDate}T${e.target.value}` : "")
              }
              className="adm-input w-auto"
            />
            <button
              type="button"
              onClick={() => setPausedUntil("")}
              disabled={!pausedUntil}
              className="adm-btn"
            >
              Clear
            </button>
          </div>
          <p className="mt-0.5 text-sm text-black/50">
            Leave empty to keep the current on/off state. When a time is set, ordering pauses until then and
            switches back on automatically — useful for private parties or kitchen closures.
          </p>
        </div>

        <div>
          <label htmlFor="paused-message" className="adm-label">
            Message shown while paused
          </label>
          <input
            id="paused-message"
            value={pausedMessage}
            maxLength={300}
            onChange={(e) => setPausedMessage(e.target.value)}
            placeholder="We're very busy right now — please call 020 8941 3595 to order."
            className="adm-input"
          />
        </div>
      </Section>

      <Section title="Collection times" description="Opening hours are Tuesday–Saturday 12:00–21:00. Collection slots are offered within these hours.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="lead-time" className="adm-label">
              Minimum prep time
            </label>
            <select id="lead-time" value={leadTime} onChange={(e) => setLeadTime(Number(e.target.value))} className="adm-input">
              {[10, 15, 20, 25, 30, 40, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slot-interval" className="adm-label">
              Slot interval
            </label>
            <select id="slot-interval" value={interval} onChange={(e) => setInterval(Number(e.target.value))} className="adm-input">
              {[5, 10, 15, 20, 30].map((m) => (
                <option key={m} value={m}>
                  Every {m} minutes
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="days-ahead" className="adm-label">
              Order ahead
            </label>
            <select id="days-ahead" value={daysAhead} onChange={(e) => setDaysAhead(Number(e.target.value))} className="adm-input">
              {[1, 2, 3, 5, 7, 10, 14].map((d) => (
                <option key={d} value={d}>
                  {d === 1 ? "Today only" : `Up to ${d} days`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section title="Holiday closures" description="Dates when the restaurant is closed. No collection slots or online bookings are offered on these days.">
        <div className="flex flex-wrap gap-2">
          <label htmlFor="closed-date" className="sr-only">
            Add a closed date
          </label>
          <input id="closed-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="adm-input w-auto" />
          <button type="button" className="adm-btn" onClick={addClosedDate} disabled={!newDate}>
            <Plus aria-hidden="true" /> Add date
          </button>
        </div>
        {closedDates.length ? (
          <ul className="flex flex-wrap gap-2">
            {closedDates.map((d) => (
              <li key={d} className="inline-flex items-center gap-2 rounded-full bg-black/5 py-1 pr-1 pl-3 text-sm">
                {formatDateLong(d)}
                <button
                  type="button"
                  onClick={() => setClosedDates((list) => list.filter((x) => x !== d))}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/10"
                  aria-label={`Remove ${formatDateLong(d)}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-black/50">No closures scheduled.</p>
        )}
      </Section>

      <Section title="Notifications" description="Where new collection orders, booking requests and contact messages are emailed.">
        <div>
          <label htmlFor="notification-email" className="adm-label">
            Restaurant email
          </label>
          <input
            id="notification-email"
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder={envRecipient ?? "orders@example.co.uk"}
            className="adm-input"
          />
        </div>
        <div className={`rounded-xl p-3 text-sm ${provider && recipient ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}>
          {provider && recipient ? (
            <p>
              Email is active via <b>{provider === "resend" ? "Resend" : "SMTP"}</b>. Notifications go to <b>{recipient}</b>.
            </p>
          ) : (
            <p>
              {provider ? "Add a restaurant email above to receive notifications." : "Email sending is not configured yet."} Orders always
              appear on this dashboard. To enable email, set <code>RESEND_API_KEY</code> or <code>SMTP_HOST</code>, <code>SMTP_USER</code>,{" "}
              <code>SMTP_PASS</code> (and optionally <code>EMAIL_FROM</code>) in the environment.
            </p>
          )}
        </div>
      </Section>

      <Section title="Website announcement" description="An optional banner shown at the top of every page, e.g. holiday hours or a special offer.">
        <div>
          <label htmlFor="announcement" className="adm-label">
            Banner text
          </label>
          <input
            id="announcement"
            value={announcement}
            maxLength={200}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="e.g. Closed for a private event on Saturday 12 December"
            className="adm-input"
          />
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="adm-btn-primary px-6 py-3 text-base shadow-xl" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save settings
        </button>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </form>
  );
}
