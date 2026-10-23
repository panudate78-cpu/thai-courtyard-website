"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Download, FileUp, Loader2, Sparkles, Trash2, TriangleAlert, Upload } from "lucide-react";
import type { ImportDraft } from "@/lib/menu-import";
import { Notice, useNotice } from "./AdminUI";

const ACCEPT = ".pdf,.csv,.xlsx,.xls,.txt,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function MenuImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState<"" | "parse" | "publish">("");
  const [notice, setNotice] = useNotice();

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy("parse");
    setFilename(file.name);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/menu/import", { method: "POST", body: form });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { draft?: ImportDraft; error?: string };
      if (!res.ok || !data.draft) throw new Error(data.error || "Could not read that file");
      setDraft(data.draft);
      if (data.draft.categories.reduce((n, c) => n + c.items.length, 0) === 0) setNotice({ type: "error", text: "No menu items were found — try the CSV template instead" });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not read that file" });
      setDraft(null);
    } finally {
      setBusy("");
    }
  }

  async function publish(mode: "replace" | "append") {
    if (!draft) return;
    const ok =
      mode === "replace"
        ? window.confirm("Replace your ENTIRE live menu with this import? This cannot be undone.")
        : window.confirm("Add these categories and dishes to your live menu?");
    if (!ok) return;
    setBusy("publish");
    try {
      const res = await fetch("/api/admin/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          mode,
          filename: draft.filename || filename,
          sourceType: draft.sourceType,
          categories: draft.categories,
        }),
      });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { categories?: number; items?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not publish the menu");
      setNotice({ type: "ok", text: `Menu published: ${data.categories} categories, ${data.items} dishes are now live` });
      setDraft(null);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not publish the menu" });
    } finally {
      setBusy("");
    }
  }

  function updateItem(ci: number, ii: number, patch: Partial<ImportDraft["categories"][number]["items"][number]>) {
    setDraft((d) =>
      d
        ? { ...d, categories: d.categories.map((c, i) => (i === ci ? { ...c, items: c.items.map((item, j) => (j === ii ? { ...item, ...patch } : item)) } : c)) }
        : d,
    );
  }

  function removeItem(ci: number, ii: number) {
    setDraft((d) => (d ? { ...d, categories: d.categories.map((c, i) => (i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c)) } : d));
  }

  const liveItems = draft?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0;

  return (
    <div className="space-y-5">
      <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={onFile} />
      <div className="adm-card grid gap-4 p-5 md:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><FileUp className="h-5 w-5" aria-hidden="true" /> Upload your menu</h2>
          <p className="mt-1 text-sm text-black/55">
            PDF, CSV or Excel (.xlsx) — categories, dishes, descriptions and prices are detected automatically.
            Nothing goes live until you review the draft and press publish.
          </p>
          <p className="mt-2 text-xs text-black/50">Scanned/image-only PDFs cannot be read — use the CSV template for those.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="adm-btn" href="/api/admin/menu/import?template=1">
            <Download aria-hidden="true" /> Download CSV template
          </a>
          <button type="button" className="adm-btn-primary" disabled={busy === "parse"} onClick={() => inputRef.current?.click()}>
            {busy === "parse" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
            {busy === "parse" ? "Reading file…" : "Choose file"}
          </button>
        </div>
      </div>

      {draft ? (
        <section className="adm-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5" aria-hidden="true" /> Review draft — {filename}</h2>
              <p className="mt-1 text-sm text-black/55">
                Found {draft.categories.length} categories and {liveItems} dishes ({draft.sourceType.toUpperCase()}). Fix anything, then publish.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="adm-btn" disabled={busy === "publish" || liveItems === 0} onClick={() => publish("append")}>
                Publish as additions
              </button>
              <button type="button" className="adm-btn-primary" disabled={busy === "publish" || liveItems === 0} onClick={() => publish("replace")}>
                {busy === "publish" ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Replace live menu & publish
              </button>
            </div>
          </div>

          {draft.warnings.length > 0 ? (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="h-4 w-4" aria-hidden="true" /> Please check</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-6">
                {draft.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 space-y-6">
            {draft.categories.map((category, ci) => (
              <div key={`${category.name}-${ci}`}>
                <h3 className="font-serif text-lg font-semibold">{category.name} <span className="text-sm font-normal text-black/45">({category.items.length})</span></h3>
                <div className="mt-2 overflow-x-auto rounded-xl border border-black/8">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-cream text-left">
                      <tr>
                        <th className="px-3 py-2">Dish</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="w-28 px-3 py-2">Price £</th>
                        <th className="w-12 px-3 py-2"><span className="sr-only">Remove</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, ii) => (
                        <tr key={`${item.name}-${ii}`} className="border-t border-black/8">
                          <td className="px-3 py-1.5"><input className="adm-input !py-1.5" value={item.name} maxLength={120} onChange={(e) => updateItem(ci, ii, { name: e.target.value })} /></td>
                          <td className="px-3 py-1.5"><input className="adm-input !py-1.5" value={item.description} maxLength={400} onChange={(e) => updateItem(ci, ii, { description: e.target.value })} /></td>
                          <td className="px-3 py-1.5"><input className="adm-input !py-1.5" type="number" min="0" step="0.05" value={(item.pricePence / 100).toFixed(2)} onChange={(e) => updateItem(ci, ii, { pricePence: Math.max(0, Math.round(Number(e.target.value || 0) * 100)) })} /></td>
                          <td className="px-3 py-1.5">
                            <button type="button" className="adm-btn !px-2" onClick={() => removeItem(ci, ii)} aria-label={`Remove ${item.name}`}>
                              <Trash2 aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-black/50">
            After publishing, fine-tune vegetarian/spicy flags, variables and photos in Menu &amp; prices. Every import is recorded in an audit log.
          </p>
        </section>
      ) : null}

      <Notice notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
