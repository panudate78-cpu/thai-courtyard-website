"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Info, Calendar as CalIcon } from "lucide-react";
import { PROVIDERS, type AccountingProvider } from "@/lib/accounting";
import { londonNow } from "@/lib/hours";

const PROVIDER_ORDER: AccountingProvider[] = ["quickbooks", "xero", "sage", "freeagent", "generic"];

function todayIso() {
  return londonNow().date;
}
function monthStartIso() {
  const t = todayIso();
  return `${t.slice(0, 7)}-01`;
}

function fmtProvider(provider: AccountingProvider) {
  const p = PROVIDERS[provider];
  return p;
}

export default function AccountingClient() {
  const [start, setStart] = useState<string>(monthStartIso());
  const [end, setEnd] = useState<string>(todayIso());

  const query = useMemo(() => {
    const s = start || monthStartIso();
    const e = end || todayIso();
    return new URLSearchParams({ start: s, end: e }).toString();
  }, [start, end]);

  const rangeLabel = useMemo(() => `${start || "?"} → ${end || "?"}`, [start, end]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="eyebrow-dark">Business</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-charcoal sm:text-4xl">Accounting Exports</h1>
          <p className="mt-2 text-sm leading-6 text-black/60">
            One-click CSVs for <strong>QuickBooks Online, Xero, Sage</strong> and <strong>FreeAgent</strong>. Sales-only: each non-cancelled
            collection order becomes one sales receipt/invoice line. Gross is VAT-inclusive; we split <strong>Net + 20% VAT</strong> so you can
            remap to No VAT/T9 if not VAT-registered. Cancelled orders are excluded.
          </p>
        </div>
      </header>

      <section className="adm-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalIcon className="h-4 w-4 text-gold-deep" aria-hidden="true" />
          Date range — Collection date
        </h2>
        <p className="mt-1 text-xs leading-5 text-black/55">
          Exports filter by <code className="rounded bg-cream px-1 py-0.5">collection_date</code> (when the food is collected), not the day the order was
          placed. Matches Sales/Reports revenue.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label className="adm-label" htmlFor="acct-start">
              Start
            </label>
            <input id="acct-start" type="date" className="adm-input" value={start} onChange={(e) => setStart(e.target.value)} max={end || undefined} />
          </div>
          <div>
            <label className="adm-label" htmlFor="acct-end">
              End
            </label>
            <input id="acct-end" type="date" className="adm-input" value={end} onChange={(e) => setEnd(e.target.value)} min={start || undefined} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setStart(monthStartIso()); setEnd(todayIso()); }} className="adm-btn">
              This month
            </button>
            <button
              type="button"
              onClick={() => {
                const t = todayIso();
                const d = new Date(`${t}T12:00:00Z`);
                d.setUTCDate(d.getUTCDate() - 30);
                setStart(d.toISOString().slice(0, 10));
                setEnd(t);
              }}
              className="adm-btn"
            >
              Last 30 days
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-black/45">Range: {rangeLabel} • Times use London (Europe/London).</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {PROVIDER_ORDER.map((provider) => {
          const meta = fmtProvider(provider);
          const href = `/api/admin/accounting/export?provider=${provider}&${query}`;
          const iconTint =
            provider === "quickbooks"
              ? "bg-[#2ca01c]/10 text-[#2ca01c] ring-[#2ca01c]/20"
              : provider === "xero"
                ? "bg-[#13b5ea]/10 text-[#13b5ea] ring-[#13b5ea]/20"
                : provider === "sage"
                  ? "bg-[#00dc00]/10 text-[#008000] ring-[#00dc00]/20"
                  : provider === "freeagent"
                    ? "bg-[#3a7bd5]/10 text-[#3a7bd5] ring-[#3a7bd5]/20"
                    : "bg-charcoal/5 text-charcoal ring-black/10";
          return (
            <div key={provider} className="adm-card flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${iconTint}`}>
                    <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-2 font-semibold">{meta.label}</h3>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-black/60">{meta.hint}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={href} className="adm-btn-primary gap-2">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download CSV
                </a>
                <a href={href} target="_blank" rel="noopener noreferrer" className="adm-btn">
                  Preview
                </a>
              </div>
              <p className="mt-3 text-[11px] leading-4 text-black/45">
                File: <code className="rounded bg-cream px-1 py-0.5">{meta.file.replace(".csv", `-${start}-to-${end}.csv`)}</code>
              </p>
            </div>
          );
        })}
      </section>

      <section className="adm-card p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Info className="h-4 w-4 text-gold-deep" aria-hidden="true" />
          How to use (VAT & import)
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6 text-black/65">
          <li>
            CSV amounts are <strong>gross VAT-inclusive</strong> as stored. Exports split <strong>Net = Gross ÷ 1.2</strong> +{" "}
            <strong>VAT 20%</strong>. If you are <em>not</em> VAT-registered, in your accounting import mapping change tax code to{" "}
            <code className="rounded bg-cream px-1 py-0.5">No VAT</code> / <code className="rounded bg-cream px-1 py-0.5">T9</code> /{" "}
            <code className="rounded bg-cream px-1 py-0.5">0%</code> and it will post Net = Gross.
          </li>
          <li>
            Each row = one <strong>non-cancelled</strong> collection order. Description ={" "}
            <code className="rounded bg-cream px-1 py-0.5">Collection Order #THAI-123 — 3 items — 2025-11-20 18:30</code>. Delivery/Deliveroo
            fees are not in this site — add separately if needed.
          </li>
          <li>
            <strong>QuickBooks:</strong> Item = <code className="rounded bg-cream px-1 py-0.5">Collection Sales : Food</code> — create once in
            Products & Services → Sales → Income: Sales. Import adds sales receipts dated by collection date.
          </li>
          <li>
            <strong>Xero:</strong> AccountCode <code className="rounded bg-cream px-1 py-0.5">200</code> (Sales). TaxType{" "}
            <code className="rounded bg-cream px-1 py-0.5">20% (VAT on Income)</code>. Currency GBP. One invoice/order, due on collection date
            (cash sales).
          </li>
          <li>
            <strong>Sage:</strong> Type <code className="rounded bg-cream px-1 py-0.5">SI</code>, Nominal{" "}
            <code className="rounded bg-cream px-1 py-0.5">4000</code>, Tax T1 (20%) — T9 for No VAT. Net+VAT=Gross is Sage&apos;s import format.
          </li>
          <li>
            <strong>FreeAgent:</strong> Price = Net, VAT 20% added by FreeAgent to reach Gross. Category Sales, payment On Collection.
          </li>
        </ul>
        <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs leading-5 text-black/55">
          Need daily summaries instead of per-order? Use <strong>Generic CSV</strong> → pivot by Date in Excel. For full API sync (auto-post on
          order paid) ask to upgrade to OAuth for QuickBooks/Xero.
        </p>
      </section>
    </div>
  );
}
