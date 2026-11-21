"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { DAY_NAMES, SITE } from "@/lib/site";
import { defaultOpeningHours, type BusinessSettingsView, type DayKey } from "@/lib/business/settings-model";
import { Notice, Toggle, useNotice } from "../AdminUI";

function nid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function RestaurantForm({ initial }: { initial: BusinessSettingsView }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useNotice();
  const [paymentMode, setPaymentMode] = useState<string>("pay_on_collection");
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/restaurant-config", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { paymentMode?: string }) => {
        if (d.paymentMode && ["pay_on_collection", "stripe_online", "customer_choice"].includes(d.paymentMode)) setPaymentMode(d.paymentMode);
      })
      .catch(() => {});
  }, []);
  const [holidayDate, setHolidayDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");

  function setDay(key: DayKey, patch: Partial<(typeof form.openingHours)[DayKey]>) {
    setForm((current) => ({
      ...current,
      openingHours: { ...current.openingHours, [key]: { ...current.openingHours[key], ...patch } },
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingHours: form.openingHours,
          holidayHours: form.holidayHours,
          specialEvents: form.specialEvents,
          contact: form.contact,
          notices: form.notices,
          announcement: form.announcement.trim(),
        }),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save restaurant settings");
      setNotice({ type: "ok", text: "Restaurant settings saved" });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save restaurant settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!initial.tablesReady ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
          The new settings tables are not available in this database yet. You can review the form, but saving needs the additive migration.
        </p>
      ) : null}

      <section className="adm-card border-l-4 border-l-teal-600 p-5">
        <h2 className="font-semibold">Collection payments</h2>
        <p className="mt-1 text-sm text-black/55">Choose how guests pay for collection orders. Pay on collection is the default and needs no Stripe. Stripe modes need STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (+ STRIPE_WEBHOOK_SECRET for webhooks) in env.</p>
        <label htmlFor="paymentMode" className="adm-label mt-3">Payment mode</label>
        <select id="paymentMode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="adm-input">
          <option value="pay_on_collection">Pay on collection — no online payment</option>
          <option value="stripe_online">Pay online only — Stripe Checkout for every order</option>
          <option value="customer_choice">Customer choice — guest picks Pay on collection or Pay online at checkout</option>
        </select>
        {paymentMode !== "pay_on_collection" ? (
          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 ring-1 ring-amber-200">Stripe enabled — ensure STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and STRIPE_WEBHOOK_SECRET are set in Vercel + .env.local. Diagnostics (/setup → Step 6) and the webhook at <code>/api/webhooks/stripe</code> validate them.</p>
        ) : null}
        <button type="button" className="adm-btn mt-3" disabled={paymentSaving} onClick={async () => {
          setPaymentSaving(true);
          try {
            const res = await fetch("/api/admin/restaurant-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paymentMode }) });
            const data = await res.json().catch(() => ({})) as { error?: string };
            if (!res.ok) throw new Error(data.error || "Could not save payment mode");
            setNotice({ type: "ok", text: `Payment mode saved: ${paymentMode.replaceAll("_", " ")}` });
          } catch (e) { setNotice({ type: "error", text: e instanceof Error ? e.message : String(e) }); } finally { setPaymentSaving(false); }
        }}>{paymentSaving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save payment mode</button>
      </section>

      <section className="adm-card border-l-4 border-l-gold p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Homepage announcement</h2>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 uppercase">Live on website</span>
        </div>
        <p className="mt-1 text-sm text-black/55">This updates the banner already shown at the top of every public page. Leave it blank to hide the banner.</p>
        <label htmlFor="announcement" className="adm-label mt-4">
          Banner text
        </label>
        <input
          id="announcement"
          className="adm-input"
          maxLength={200}
          value={form.announcement}
          onChange={(event) => setForm({ ...form, announcement: event.target.value })}
          placeholder="e.g. Closed for a private event on Saturday 12 December"
        />
      </section>

      <section className="adm-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Opening hours</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">Saved for the team · not published</span>
        </div>
        <p className="mt-1 text-sm text-black/55">
          The public website, collection slots and booking times still use {SITE.hoursSummary}. Changing these hours does not change what guests can book. To stop online orders on a date, add it under Settings → Holiday closures.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="text-left text-[11px] tracking-wide text-black/45 uppercase">
                <th className="py-2">Day</th>
                <th>Closed</th>
                <th>Opens</th>
                <th>Closes</th>
              </tr>
            </thead>
            <tbody>
              {(["0", "1", "2", "3", "4", "5", "6"] as DayKey[]).map((key) => {
                const day = form.openingHours[key];
                return (
                  <tr key={key} className="border-t border-black/5">
                    <td className="py-2 font-medium">{DAY_NAMES[Number(key)]}</td>
                    <td>
                      <Toggle checked={day.closed} onChange={(closed) => setDay(key, { closed })} label={`${DAY_NAMES[Number(key)]} closed`} />
                    </td>
                    <td>
                      <input type="time" className="adm-input w-32" value={day.open} disabled={day.closed} onChange={(event) => setDay(key, { open: event.target.value })} />
                    </td>
                    <td>
                      <input type="time" className="adm-input w-32" value={day.close} disabled={day.closed} onChange={(event) => setDay(key, { close: event.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" className="adm-btn mt-3" onClick={() => setForm({ ...form, openingHours: defaultOpeningHours() })}>
          Reset to website hours
        </button>
      </section>

      <section className="adm-card p-5">
        <h2 className="font-semibold">Holiday hours</h2>
        <p className="mt-1 text-sm text-black/55">A staff record of Christmas, private hire and other exceptions. This list does not close online ordering by itself.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input type="date" className="adm-input w-auto" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} aria-label="Holiday date" />
          <button
            type="button"
            className="adm-btn"
            disabled={!holidayDate}
            onClick={() => {
              if (form.holidayHours.some((row) => row.date === holidayDate)) return;
              setForm({
                ...form,
                holidayHours: [...form.holidayHours, { id: nid("hol"), date: holidayDate, closed: true, open: null, close: null, note: "" }].sort((a, b) => a.date.localeCompare(b.date)),
              });
              setHolidayDate("");
            }}
          >
            <Plus aria-hidden="true" /> Add holiday
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {form.holidayHours.map((row) => (
            <li key={row.id} className="grid gap-2 rounded-xl bg-cream p-3 sm:grid-cols-[9rem_auto_1fr_auto] sm:items-center">
              <span className="font-medium">{row.date}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.closed}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      holidayHours: form.holidayHours.map((item) =>
                        item.id === row.id ? { ...item, closed: event.target.checked, open: event.target.checked ? null : "12:00", close: event.target.checked ? null : "21:00" } : item,
                      ),
                    })
                  }
                />
                Closed
              </label>
              <input
                className="adm-input"
                placeholder="Note, e.g. Christmas Day"
                value={row.note}
                maxLength={160}
                onChange={(event) =>
                  setForm({
                    ...form,
                    holidayHours: form.holidayHours.map((item) => (item.id === row.id ? { ...item, note: event.target.value } : item)),
                  })
                }
              />
              <button type="button" className="adm-btn" onClick={() => setForm({ ...form, holidayHours: form.holidayHours.filter((item) => item.id !== row.id) })}>
                <Trash2 aria-hidden="true" /> Remove
              </button>
              {!row.closed ? (
                <div className="flex gap-2 sm:col-span-4">
                  <input
                    type="time"
                    className="adm-input w-32"
                    value={row.open ?? "12:00"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        holidayHours: form.holidayHours.map((item) => (item.id === row.id ? { ...item, open: event.target.value } : item)),
                      })
                    }
                  />
                  <input
                    type="time"
                    className="adm-input w-32"
                    value={row.close ?? "21:00"}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        holidayHours: form.holidayHours.map((item) => (item.id === row.id ? { ...item, close: event.target.value } : item)),
                      })
                    }
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {!form.holidayHours.length ? <p className="mt-3 text-sm text-black/50">No holiday hours saved.</p> : null}
      </section>

      <section className="adm-card p-5">
        <h2 className="font-semibold">Special events</h2>
        <p className="mt-1 text-sm text-black/55">Private hires, festival menus and celebrations. Stored for the team, not published on the public site.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
          <input className="adm-input" placeholder="Event title" value={eventTitle} maxLength={80} onChange={(event) => setEventTitle(event.target.value)} />
          <input type="date" className="adm-input" value={eventDate} onChange={(event) => setEventDate(event.target.value)} aria-label="Event date" />
          <button
            type="button"
            className="adm-btn"
            disabled={eventTitle.trim().length < 2 || !eventDate}
            onClick={() => {
              setForm({
                ...form,
                specialEvents: [...form.specialEvents, { id: nid("evt"), title: eventTitle.trim(), date: eventDate, endDate: null, description: "" }].sort((a, b) => a.date.localeCompare(b.date)),
              });
              setEventTitle("");
              setEventDate("");
            }}
          >
            <Plus aria-hidden="true" /> Add event
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {form.specialEvents.map((event) => (
            <li key={event.id} className="rounded-xl bg-cream p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{event.title}</p>
                <button type="button" className="adm-btn" onClick={() => setForm({ ...form, specialEvents: form.specialEvents.filter((item) => item.id !== event.id) })}>
                  <Trash2 aria-hidden="true" /> Remove
                </button>
              </div>
              <p className="mt-1 text-xs text-black/50">{event.date}</p>
              <textarea
                className="adm-input mt-2 min-h-20"
                placeholder="Notes for the team"
                maxLength={400}
                value={event.description}
                onChange={(change) =>
                  setForm({
                    ...form,
                    specialEvents: form.specialEvents.map((item) => (item.id === event.id ? { ...item, description: change.target.value } : item)),
                  })
                }
              />
            </li>
          ))}
        </ul>
        {!form.specialEvents.length ? <p className="mt-3 text-sm text-black/50">No special events saved.</p> : null}
      </section>

      <section className="adm-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Contact information</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">Not published</span>
        </div>
        <p className="mt-1 text-sm text-black/55">
          Guests still see {SITE.phoneDisplay} and {SITE.addressLine}. This copy is for the management record.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["phoneDisplay", "Phone"],
              ["email", "Email"],
              ["street", "Street"],
              ["locality", "Town"],
              ["postcode", "Postcode"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="adm-label">{label}</span>
              <input
                className="adm-input"
                value={form.contact[key]}
                onChange={(event) => setForm({ ...form, contact: { ...form.contact, [key]: event.target.value } })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="adm-card p-5">
        <h2 className="font-semibold">Restaurant notices</h2>
        <p className="mt-1 text-sm text-black/55">Internal notices for service, suppliers or the team. They are not shown to guests.</p>
        <div className="mt-4 grid gap-2">
          <input className="adm-input" placeholder="Notice title" value={noticeTitle} maxLength={80} onChange={(event) => setNoticeTitle(event.target.value)} />
          <textarea className="adm-input min-h-20" placeholder="What should the team know?" value={noticeBody} maxLength={500} onChange={(event) => setNoticeBody(event.target.value)} />
          <button
            type="button"
            className="adm-btn w-fit"
            disabled={noticeTitle.trim().length < 2 || noticeBody.trim().length < 2}
            onClick={() => {
              setForm({
                ...form,
                notices: [{ id: nid("note"), title: noticeTitle.trim(), body: noticeBody.trim(), active: true }, ...form.notices],
              });
              setNoticeTitle("");
              setNoticeBody("");
            }}
          >
            <Plus aria-hidden="true" /> Add notice
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {form.notices.map((item) => (
            <li key={item.id} className="rounded-xl bg-cream p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{item.title}</p>
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={item.active}
                    label={`${item.title} active`}
                    onChange={(active) => setForm({ ...form, notices: form.notices.map((notice) => (notice.id === item.id ? { ...notice, active } : notice)) })}
                  />
                  <button type="button" className="adm-btn" onClick={() => setForm({ ...form, notices: form.notices.filter((notice) => notice.id !== item.id) })}>
                    <Trash2 aria-hidden="true" /> Remove
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-black/70">{item.body}</p>
            </li>
          ))}
        </ul>
        {!form.notices.length ? <p className="mt-3 text-sm text-black/50">No notices saved.</p> : null}
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="adm-btn-primary px-6 py-3 text-base shadow-xl" disabled={saving || !initial.tablesReady}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save restaurant settings
        </button>
      </div>
      <section className="adm-card border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">Setup Wizard</h2>
        <p className="mt-1 text-sm text-amber-900/70">Re-open the white-label setup wizard (/setup) to change branding, hours, SEO areas, menu, images, or admin password. Requires SETUP_TOKEN if set.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/setup" target="_blank" rel="noopener noreferrer" className="adm-btn bg-white">Open /setup</a>
          <button type="button" className="adm-btn" onClick={async () => {
            const token = window.prompt("Enter SETUP_TOKEN (leave blank if none set)");
            if (token === null) return;
            const res = await fetch("/api/setup/reopen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token || undefined }) });
            const data = await res.json().catch(() => ({}));
            if (res.ok) { setNotice({ type: "ok", text: "Setup wizard re-opened — /setup is now unlocked until you complete it again." }); }
            else setNotice({ type: "error", text: (data as { error?: string }).error || "Could not re-open setup" });
          }}>Re-open Setup Wizard (unlock)</button>
        </div>
      </section>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </form>
  );
}
