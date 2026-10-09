"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChefHat,
  Clock,
  Inbox,
  Mail,
  Phone,
  Printer,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { escapeHtml, formatPrice } from "@/lib/format";
import { formatDateLong, fromMinutes, londonDateTime, londonNow, relativeDayLabel, toMinutes, type LondonNow } from "@/lib/hours";
import type { OrderStatus, OrderView } from "@/lib/types";

const STATUS_STYLE: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: "New", className: "bg-amber-100 text-amber-900 ring-amber-300" },
  accepted: { label: "Preparing", className: "bg-sky-100 text-sky-900 ring-sky-300" },
  ready: { label: "Ready", className: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  collected: { label: "Collected", className: "bg-black/5 text-black/60 ring-black/10" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 ring-red-300" },
};

const EMAIL_STATUS: Record<string, string> = {
  sent: "Email sent",
  logged: "Email not configured",
  failed: "Email failed",
  pending: "Email sending…",
};

const ACTIVE: OrderStatus[] = ["new", "accepted", "ready"];

type Tab = "active" | "all" | "history" | OrderStatus;

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "new", label: "New" },
  { id: "accepted", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "collected", label: "Collected" },
  { id: "cancelled", label: "Cancelled" },
  { id: "history", label: "History" },
  { id: "all", label: "All" },
];

function playChime(ctx: AudioContext) {
  const now = ctx.currentTime;

  [880, 1108.73, 1318.51, 880, 1108.73, 1318.51].forEach(
    (frequency, i) => {
      const offset = i * 0.7;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

 gain.gain.setValueAtTime(0.0001, now + offset);
 
gain.gain.exponentialRampToValueAtTime(
1,
now + offset + 0.03
);
 
gain.gain.exponentialRampToValueAtTime(
0.0001,
now + offset + 1.0
);
 
osc.connect(gain);
gain.connect(ctx.destination);
 
osc.start(now + offset);
osc.stop(now + offset + 1.1);
    }
  );
}


function printTicket(order: OrderView) {
  const w = window.open("", "_blank", "width=420,height=720");
  if (!w) return;
  const e = escapeHtml;
  const placed = londonDateTime(order.createdAt);
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:4px 0;vertical-align:top"><b>${i.quantity} x ${e(i.name)}</b>${
          i.options.length ? `<br><span style="font-size:12px">${e(i.options.map((o) => o.choice).join(", "))}</span>` : ""
        }</td><td style="padding:4px 0;text-align:right;vertical-align:top">${formatPrice(i.lineTotalPence)}</td></tr>`,
    )
    .join("");
  w.document.write(
    `<!doctype html><html><head><title>Order #${order.number}</title><style>body{font-family:ui-monospace,Menlo,Consolas,monospace;padding:16px;color:#000}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;font-size:14px}hr{border:0;border-top:1px dashed #000;margin:10px 0}</style></head><body>` +
      `<h1>THAI COURTYARD</h1><div>COLLECTION ORDER <b>#${order.number}</b></div><hr>` +
      `<div><b>Collect:</b> ${e(formatDateLong(order.collectionDate))} at ${e(order.collectionTime)}</div>` +
      `<div><b>Name:</b> ${e(order.customerName)}</div><div><b>Tel:</b> ${e(order.phone)}</div><hr>` +
      `<table>${rows}</table><hr><table><tr><td><b>TOTAL - PAY ON COLLECTION</b></td><td style="text-align:right"><b>${formatPrice(
        order.subtotalPence,
      )}</b></td></tr></table>` +
      (order.instructions ? `<hr><div><b>NOTES:</b> ${e(order.instructions)}</div>` : "") +
      `<hr><div style="font-size:12px">Placed ${e(placed.time)} on ${e(formatDateLong(placed.date))}</div>` +
      `<script>window.onload=function(){window.print();}</script></body></html>`,
  );
  w.document.close();
}

type Props = { initialOrders: OrderView[]; scope: "live" | "all"; today: string };

export function OrdersBoard({ initialOrders, scope, today }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [tab, setTab] = useState<Tab>(scope === "live" ? "active" : "all");
  const [query, setQuery] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [fresh, setFresh] = useState<number[]>([]);
  const [now, setNow] = useState<LondonNow | null>(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState<string | null>(null);
  const known = useRef(new Set(initialOrders.map((o) => o.id)));
  const audio = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);
  const alarmTimer = useRef<ReturnType<typeof setInterval> | null>(null);
function startAlarm() {
  if (!audio.current) return;
  if (alarmTimer.current) return;

  playChime(audio.current);

  alarmTimer.current = setInterval(() => {
    if (audio.current) {
      playChime(audio.current);
    }
  }, 5000);
}

function stopAlarm() {
  if (alarmTimer.current) {
    clearInterval(alarmTimer.current);
    alarmTimer.current = null;
  }
}

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?scope=${scope}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
if (!res.ok) throw new Error("Could not refresh orders — retrying…");

const data = (await res.json()) as { orders: OrderView[] };

const incoming = data.orders.filter((o) => !known.current.has(o.id));

data.orders.forEach((o) => known.current.add(o.id));

if (incoming.length) {
  setFresh((f) => [...f, ...incoming.map((o) => o.id)]);

  if (soundRef.current && audio.current) {
  playChime(audio.current);
}

  router.refresh();
}
      
      setOrders(data.orders);
      const current = londonNow();
      setNow(current);
      setLastUpdated(fromMinutes(current.minutes));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    }
  }, [scope, router]);

  useEffect(() => {
    const current = londonNow();
    setNow(current);
    setLastUpdated(fromMinutes(current.minutes));
    const timer = setInterval(refresh, 15_000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const pending = orders.filter((o) => o.status === "new").length;
    document.title = pending ? `(${pending}) New order${pending > 1 ? "s" : ""} · Thai Courtyard Admin` : "Orders · Thai Courtyard Admin";
  }, [orders]);

  function toggleSound() {
    if (!audio.current) {
      const Ctor =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) audio.current = new Ctor();
    }
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    if (next && audio.current) {
      void audio.current.resume();
      playChime(audio.current);
    }
  }

  async function setStatus(order: OrderView, status: OrderStatus) {
    if (status === "cancelled" && !window.confirm(`Cancel order #${order.number} for ${order.customerName}?`)) return;
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { order?: OrderView; error?: string };
      const updated = data.order;
      if (!res.ok || !updated) throw new Error(data.error || "Could not update the order");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      setFresh((f) => f.filter((id) => id !== order.id));
      stopAlarm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the order");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const result: Record<Tab, number> = {
  active: 0,
  history: 0,
  all: orders.length,
  new: 0,
  accepted: 0,
  ready: 0,
  collected: 0,
  cancelled: 0
};
    for (const o of orders) {
  result[o.status] += 1;

  if (ACTIVE.includes(o.status)) {
    result.active += 1;
  }

  if (
    o.status === "collected" ||
    o.status === "cancelled"
  ) {
    result.history += 1;
  }
}
``
    return result;
  }, [orders]);

  const todayDate = now?.date ?? today;
  const q = query.trim().toLowerCase();
  const filtered = orders.filter((o) => {
  if (tab === "active" && !ACTIVE.includes(o.status)) return false;

  if (
    tab === "history" &&
    o.status !== "collected" &&
    o.status !== "cancelled"
  )
    return false;

  if (
    tab !== "active" &&
    tab !== "all" &&
    tab !== "history" &&
    o.status !== tab
  )
    return false;

  if (
    q &&
    !`${o.number} ${o.customerName} ${o.phone} ${o.email ?? ""}`
      .toLowerCase()
      .includes(q)
  )
    return false;

  return true;
});
const historyOrders = filtered.length;

const collectedOrders = filtered.filter(
  (o) => o.status === "collected"
).length;

const cancelledOrders = filtered.filter(
  (o) => o.status === "cancelled"
).length;

const revenuePence = filtered
  .filter((o) => o.status === "collected")
  .reduce((sum, o) => sum + o.subtotalPence, 0);
  const averageOrderPence =
  collectedOrders > 0
    ? Math.round(revenuePence / collectedOrders)
    : 0;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5" role="group" aria-label="Filter orders">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                tab === t.id ? "bg-charcoal text-cream" : "text-black/70 hover:bg-black/5"
              }`}
            >
              {t.label}
              {counts[t.id] > 0 ? <span className="ml-1.5 text-xs opacity-70">{counts[t.id]}</span> : null}
            </button>
          ))}
        </div>
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black/40" aria-hidden="true" />
          <label htmlFor={`order-search-${scope}`} className="sr-only">
            Search orders
          </label>
          <input
            id={`order-search-${scope}`}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or order no."
            className="adm-input pl-9"
          />
        </div>
        <button type="button" onClick={toggleSound} className={soundOn ? "adm-btn-primary" : "adm-btn"} aria-pressed={soundOn}>
          {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          {soundOn ? "ORDER ALERTS ACTIVE" : "ENABLE ORDER ALERTS"}
        </button>
        <button type="button" onClick={() => void refresh()} className="adm-btn" aria-label="Refresh orders">
          <RefreshCw aria-hidden="true" />
          <span className="hidden sm:inline">{lastUpdated ? `Updated ${lastUpdated}` : "Refresh"}</span>
        </button>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {fresh.length > 0 ? (
  <div
    role="status"
    className="animate-pulse rounded-xl border-4 border-red-600 bg-red-600 p-4 text-center text-xl font-bold text-white shadow-lg"
  >
    🚨 NEW ORDER RECEIVED 🚨
    <div className="mt-1 text-sm font-medium">
      {fresh.length} new order{fresh.length > 1 ? "s" : ""}
    </div>
  </div>
) : null}
{tab === "history" ? (
  <div className="mb-4 rounded-xl border border-sand bg-white p-4">
    <div className="grid gap-4 sm:grid-cols-4">
      <div>
        <p className="text-xs uppercase text-charcoal/60">
          Orders
        </p>
        <p className="text-2xl font-bold">
          {historyOrders}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-charcoal/60">
          Collected
        </p>
        <p className="text-2xl font-bold text-emerald-600">
          {collectedOrders}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-charcoal/60">
          Cancelled
        </p>
        <p className="text-2xl font-bold text-red-600">
          {cancelledOrders}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase text-charcoal/60">
          Revenue
        </p>
        <p className="text-2xl font-bold">
          £{(revenuePence / 100).toFixed(2)}
        </p>
      </div>
    </div>
  </div>
) : null}
      {filtered.length === 0 ? (
        <div className="adm-card flex flex-col items-center p-10 text-center text-black/50">
          <Inbox className="h-10 w-10" aria-hidden="true" />
          <p className="mt-3 font-medium">No orders here yet.</p>
          <p className="text-sm">New collection orders will appear automatically.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((o) => {
            const style = STATUS_STYLE[o.status];
            const placed = londonDateTime(o.createdAt);
            const isToday = o.collectionDate === todayDate;
            const diff = now && isToday ? toMinutes(o.collectionTime) - now.minutes : null;
            const isActive = ACTIVE.includes(o.status);
            const dueSoon = isActive && diff !== null && diff <= 30;
            const dueText = diff === null ? "" : diff > 0 ? `in ${diff} min` : diff === 0 ? "due now" : `${-diff} min overdue`;
            const busy = busyId === o.id;
            return (
              <article
                key={o.id}
                className={`adm-card flex flex-col p-5 ${fresh.includes(o.id) ? "ring-4 ring-red-500 animate-pulse" : ""} ${isActive ? "" : "opacity-80"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-black/45 uppercase">Collection order</p>
                    <h3 className="text-2xl font-bold">#{o.number}</h3>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${style.className}`}>{style.label}</span>
                </div>
                <p
                  className={`mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
                    dueSoon ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-black/[0.03]"
                  }`}
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Collect {relativeDayLabel(o.collectionDate, todayDate)} at {o.collectionTime}
                  {isActive && dueText ? <span className="font-normal text-black/55">· {dueText}</span> : null}
                </p>
                <div className="mt-3 text-sm">
                  <p className="font-semibold">{o.customerName}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-black/65">
                    <a href={`tel:${o.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:underline">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {o.phone}
                    </a>
                    {o.email ? (
                      <a href={`mailto:${o.email}`} className="inline-flex items-center gap-1 break-all hover:underline">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                        {o.email}
                      </a>
                    ) : null}
                  </p>
                </div>
                <ul className="mt-3 divide-y divide-black/5 border-y border-black/5 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-2">
                      <span>
                        <b>{i.quantity} ×</b> {i.name}
                        {i.options.length ? (
                          <span className="block text-xs text-black/55">{i.options.map((op) => op.choice).join(" · ")}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0">{formatPrice(i.lineTotalPence)}</span>
                    </li>
                  ))}
                </ul>
                {o.instructions ? (
                  <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200">
                    <b>Instructions:</b> {o.instructions}
                  </p>
                ) : null}
                <div className="mt-3 flex items-end justify-between gap-3 text-xs text-black/50">
                  <span>
                    Placed {placed.time}
                    {placed.date !== todayDate ? ` · ${relativeDayLabel(placed.date, todayDate)}` : ""}
                    <br />
                    {EMAIL_STATUS[o.emailStatus] ?? o.emailStatus}
                  </span>
                  <span className="text-right">
                    <span className="block text-lg font-bold text-charcoal">{formatPrice(o.subtotalPence)}</span>
                    Pay on collection
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {o.status === "new" ? (
                    <button type="button" className="adm-btn-primary flex-1" disabled={busy} onClick={() => setStatus(o, "accepted")}>
                      <ChefHat aria-hidden="true" /> Accept order
                    </button>
                  ) : null}
                  {o.status === "accepted" ? (
                    <button type="button" className="adm-btn-primary flex-1" disabled={busy} onClick={() => setStatus(o, "ready")}>
                      <CheckCircle2 aria-hidden="true" /> Mark ready
                    </button>
                  ) : null}
                  {o.status === "ready" ? (
                    <button type="button" className="adm-btn-primary flex-1" disabled={busy} onClick={() => setStatus(o, "collected")}>
                      <Check aria-hidden="true" /> Collected &amp; paid
                    </button>
                  ) : null}
                  {!isActive ? (
                    <button type="button" className="adm-btn flex-1" disabled={busy} onClick={() => setStatus(o, "accepted")}>
                      <RefreshCw aria-hidden="true" /> Reopen
                    </button>
                  ) : null}
                  <button type="button" className="adm-btn" onClick={() => printTicket(o)} aria-label={`Print order ${o.number}`}>
                    <Printer aria-hidden="true" />
                  </button>
                  {isActive ? (
                    <button
                      type="button"
                      className="adm-btn-danger"
                      disabled={busy}
                      onClick={() => setStatus(o, "cancelled")}
                      aria-label={`Cancel order ${o.number}`}
                    >
                      <X aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
