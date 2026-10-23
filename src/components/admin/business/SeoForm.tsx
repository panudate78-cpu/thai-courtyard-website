"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { SeoPageEditor } from "@/lib/business/seo";
import { Notice, useNotice } from "../AdminUI";

type ImageOption = { src: string; alt: string };

export function SeoForm({ pages, images, tablesReady }: { pages: SeoPageEditor[]; images: ImageOption[]; tablesReady: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useState(pages);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useNotice();

  function patch(path: string, key: keyof SeoPageEditor, value: string) {
    setRows((current) => current.map((page) => (page.path === path ? { ...page, [key]: value } : page)));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: rows.map((page) => ({
            path: page.path,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            ogTitle: page.ogTitle,
            ogDescription: page.ogDescription,
            ogImage: page.ogImage,
          })),
        }),
      });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save SEO overrides");
      setNotice({ type: "ok", text: "SEO overrides saved" });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save SEO overrides" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!tablesReady ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">
          SEO overrides cannot be saved until the additive table exists. Live SEO below is unchanged.
        </p>
      ) : null}
      {rows.map((page) => (
        <section key={page.path} className="adm-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">
              {page.label} <span className="font-normal text-black/45">{page.path}</span>
            </h2>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${page.hasOverride ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}>
              {page.hasOverride ? "Override saved · not published" : "Using live SEO"}
            </span>
          </div>
          <div className="mt-3 rounded-xl bg-cream p-3 text-sm">
            <p className="text-[11px] font-semibold tracking-wide text-black/45 uppercase">Live meta title</p>
            <p className="mt-1 font-medium">{page.liveTitle}</p>
            <p className="mt-1 text-black/70">{page.liveDescription}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="adm-label">Override title</span>
              <input className="adm-input" maxLength={90} value={page.metaTitle} placeholder={page.liveTitle} onChange={(event) => patch(page.path, "metaTitle", event.target.value)} />
            </label>
            <label className="text-sm">
              <span className="adm-label">Open Graph title</span>
              <input className="adm-input" maxLength={90} value={page.ogTitle} onChange={(event) => patch(page.path, "ogTitle", event.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="adm-label">Override description</span>
              <textarea className="adm-input min-h-20" maxLength={400} value={page.metaDescription} onChange={(event) => patch(page.path, "metaDescription", event.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="adm-label">Open Graph description</span>
              <textarea className="adm-input min-h-20" maxLength={400} value={page.ogDescription} onChange={(event) => patch(page.path, "ogDescription", event.target.value)} />
            </label>
            <label className="text-sm md:col-span-2">
              <span className="adm-label">Social image</span>
              <select className="adm-input" value={page.ogImage} onChange={(event) => patch(page.path, "ogImage", event.target.value)}>
                <option value="">No override — site default</option>
                {images.map((image) => (
                  <option key={image.src} value={image.src}>
                    {image.alt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {page.ogImage ? (
            // Admin preview of an image already hosted on this site.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.ogImage} alt="" className="mt-3 h-28 w-full rounded-xl object-cover" />
          ) : null}
          <p className="mt-3 text-xs text-black/45">Structured data on this page: {page.structuredData.join(", ")}</p>
        </section>
      ))}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="adm-btn-primary px-6 py-3 text-base shadow-xl" disabled={saving || !tablesReady}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save SEO overrides
        </button>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </form>
  );
}
