"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Eraser, Loader2, RotateCcw } from "lucide-react";
import { Notice, useNotice } from "./AdminUI";

type Status = {
  orders: number;
  bookings: number;
  customers: number;
  demoMode: boolean;
  setupCompleted: boolean;
};

export function DemoControls() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<"" | "reset" | "clear">("");
  const [notice, setNotice] = useNotice();

  async function load() {
    try {
      const res = await fetch("/api/admin/demo", { cache: "no-store" });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const payload = (await res.json()) as { status?: Status };
      setStatus(payload.status ?? null);
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/demo", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) {
          window.location.assign("/admin/login");
          return;
        }
        const data = (await res.json()) as { status?: Status };
        if (!cancelled) setStatus(data.status ?? null);
      } catch {
        if (!cancelled) setStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(action: "reset" | "clear") {
    const message =
      action === "reset"
        ? "Reset demo data? This replaces the current menu with the demo menu and regenerates ~14 days of demo orders, bookings, customers and reports. Real (non-demo) orders are kept."
        : "Remove ALL demo data? Demo orders, bookings, demo-only customers and the sample dashboard fallback will be switched off. The menu is kept. This cannot be undone.";
    if (!window.confirm(message)) return;
    setBusy(action);
    try {
      const res = await fetch("/api/admin/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; status?: Status };
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      if (data.status) setStatus(data.status);
      setNotice({
        type: "ok",
        text:
          action === "reset"
            ? `Demo data reset — ${data.status?.orders ?? 0} demo orders and ${data.status?.bookings ?? 0} demo bookings ready`
            : "Demo data removed — the site now uses live data only",
      });
      await load();
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Something went wrong" });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="adm-card grid gap-5 p-5 md:grid-cols-[260px_minmax(0,1fr)] md:p-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Database className="h-5 w-5" aria-hidden="true" /> Demo data</h2>
        <p className="mt-1 text-sm text-black/55">
          The platform ships with a demo restaurant, menu, customers, orders, bookings and reports so you can explore before setup.
          Demo records are clearly labelled and can be removed at any time.
        </p>
      </div>
      <div className="space-y-4">
        {status ? (
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-cream p-3"><dt className="text-black/55">Mode</dt><dd className="font-semibold">{status.demoMode ? "Demo mode ON" : "Live"}</dd></div>
            <div className="rounded-xl bg-cream p-3"><dt className="text-black/55">Setup</dt><dd className="font-semibold">{status.setupCompleted ? "Completed" : "Not finished"}</dd></div>
            <div className="rounded-xl bg-cream p-3"><dt className="text-black/55">Demo orders</dt><dd className="font-semibold">{status.orders}</dd></div>
            <div className="rounded-xl bg-cream p-3"><dt className="text-black/55">Demo bookings</dt><dd className="font-semibold">{status.bookings}</dd></div>
            <div className="rounded-xl bg-cream p-3"><dt className="text-black/55">Demo customers</dt><dd className="font-semibold">{status.customers}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-black/50">Loading demo status…</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="adm-btn" disabled={busy !== ""} onClick={() => act("reset")}>
            {busy === "reset" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            Reset Demo Data
          </button>
          <button type="button" className="adm-btn-danger" disabled={busy !== ""} onClick={() => act("clear")}>
            {busy === "clear" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Eraser aria-hidden="true" />}
            Remove Demo Data
          </button>
        </div>
        <p className="text-xs text-black/50">
          “Reset” is safe to run repeatedly — it only replaces demo-tagged records. Before launching, run Remove Demo Data and complete the Setup Wizard.
        </p>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </section>
  );
}
