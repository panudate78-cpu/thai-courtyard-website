"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Notice, Toggle, useNotice } from "@/components/admin/AdminUI";
import type { OfferStatus } from "@/lib/offers";

type Offer = {
  id: number;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageData: string | null;
  startsOn: string;
  endsOn: string;
  displayOrder: number;
  enabled: boolean;
  status: OfferStatus;
};

type FormValues = Omit<Offer, "id" | "status">;
const EMPTY: FormValues = {
  title: "",
  description: "",
  ctaText: "Find out more",
  ctaLink: "/order",
  imageData: null,
  startsOn: new Date().toISOString().slice(0, 10),
  endsOn: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  displayOrder: 0,
  enabled: true,
};

export function OffersManager({ initialOffers }: { initialOffers: Offer[] }) {
  const [offers, setOffers] = useState(initialOffers);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormValues>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useNotice();

  function startCreate() {
    setEditingId(null);
    setShowForm(true);
    setForm({ ...EMPTY });
  }
  function startEdit(offer: Offer) {
    setShowForm(true);
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      ctaText: offer.ctaText,
      ctaLink: offer.ctaLink,
      imageData: offer.imageData,
      startsOn: offer.startsOn,
      endsOn: offer.endsOn,
      displayOrder: offer.displayOrder,
      enabled: offer.enabled,
    });
  }
  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: editingId ? "update" : "create", ...(editingId ? { id: editingId } : {}), ...form }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the offer.");
      const refreshed = await fetch("/api/admin/offers/list", { cache: "no-store" });
      if (refreshed.ok) setOffers(await refreshed.json());
      setNotice({ type: "ok", text: editingId ? "Offer updated." : "Offer created." });
      setEditingId(null);
      setShowForm(false);
      setForm({ ...EMPTY });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save the offer." });
    } finally {
      setBusy(false);
    }
  }

  async function action(payload: { action: "toggle" | "delete"; id: number; enabled?: boolean }) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the change.");
      const refreshed = await fetch("/api/admin/offers/list", { cache: "no-store" });
      if (refreshed.ok) setOffers(await refreshed.json());
      if (payload.action === "delete") setNotice({ type: "ok", text: "Offer deleted." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save the change." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Offers &amp; promotions</h2>
          <p className="mt-1 text-sm text-black/55">Only enabled offers within their date range appear on the public website.</p>
        </div>
        <button type="button" className="adm-btn-primary" onClick={startCreate}>
          <Plus aria-hidden="true" /> Create offer
        </button>
      </div>

      {showForm ? (
        <form onSubmit={submit} className="adm-card grid gap-4 p-4 sm:p-5">
          <h3 className="font-semibold">{editingId ? "Edit offer" : "New offer"}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className="adm-label">Title</span><input className="adm-input" required maxLength={120} value={form.title} onChange={(e) => setField("title", e.target.value)} /></label>
            <label><span className="adm-label">Display order</span><input className="adm-input" type="number" min={0} max={10000} value={form.displayOrder} onChange={(e) => setField("displayOrder", Number(e.target.value))} /></label>
            <label className="md:col-span-2"><span className="adm-label">Description</span><textarea className="adm-input min-h-24" maxLength={1200} value={form.description} onChange={(e) => setField("description", e.target.value)} /></label>
            <label><span className="adm-label">CTA button text</span><input className="adm-input" required maxLength={40} value={form.ctaText} onChange={(e) => setField("ctaText", e.target.value)} /></label>
            <label><span className="adm-label">CTA button link</span><input className="adm-input" required maxLength={2048} value={form.ctaLink} onChange={(e) => setField("ctaLink", e.target.value)} /></label>
            <label><span className="adm-label">Start date</span><input className="adm-input" type="date" required value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)} /></label>
            <label><span className="adm-label">End date</span><input className="adm-input" type="date" required value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)} /></label>
            <label className="md:col-span-2"><span className="adm-label">Offer image (PNG, JPEG or WebP; up to 2 MB)</span><input className="adm-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              if (file.size > 2 * 1024 * 1024) {
                setNotice({ type: "error", text: "Choose an image smaller than 2 MB." });
                event.currentTarget.value = "";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => setField("imageData", typeof reader.result === "string" ? reader.result : null);
              reader.readAsDataURL(file);
            }} /></label>
          </div>
          {form.imageData ? <div className="flex items-center gap-4"><Image src={form.imageData} alt="Offer preview" width={320} height={200} unoptimized className="h-20 w-32 rounded-lg object-cover" /><button type="button" className="adm-btn" onClick={() => setField("imageData", null)}>Remove image</button></div> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Toggle checked={form.enabled} onChange={(enabled) => setField("enabled", enabled)} label={form.enabled ? "Offer active" : "Offer inactive"} />
            <span className="text-sm">{form.enabled ? "Active" : "Inactive"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="adm-btn-primary" disabled={busy} type="submit">{busy ? "Saving…" : editingId ? "Save changes" : "Create offer"}</button>
            <button className="adm-btn" type="button" onClick={() => { setEditingId(null); setShowForm(false); setForm({ ...EMPTY }); }}>Cancel</button>
          </div>
        </form>
      ) : null}

      {offers.length === 0 ? <p className="rounded-xl bg-white p-6 text-center text-sm text-black/55 ring-1 ring-black/5">No offers have been created.</p> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {offers.map((offer) => (
            <article key={offer.id} className="adm-card overflow-hidden">
              {offer.imageData ? <Image src={offer.imageData} alt="" width={960} height={480} unoptimized className="h-44 w-full object-cover" /> : null}
              <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="text-lg font-semibold">{offer.title}</h3><p className="mt-1 text-sm leading-6 text-black/60">{offer.description || "No description"}</p></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${offer.status === "Active" ? "bg-emerald-50 text-emerald-800" : offer.status === "Scheduled" ? "bg-blue-50 text-blue-800" : offer.status === "Expired" ? "bg-black/5 text-black/55" : "bg-amber-50 text-amber-900"}`}>{offer.status}</span>
                </div>
                <p className="text-xs text-black/55">{offer.startsOn} – {offer.endsOn} · Order {offer.displayOrder}</p>
                <div className="flex flex-wrap items-center gap-3 border-t border-black/5 pt-3">
                  <Toggle checked={offer.enabled} disabled={busy} onChange={(enabled) => void action({ action: "toggle", id: offer.id, enabled })} label={offer.enabled ? "Active" : "Inactive"} />
                  <span className="text-sm font-medium">{offer.enabled ? "Active" : "Inactive"}</span>
                  <span className="ml-auto" />
                  <button className="adm-btn" type="button" disabled={busy} onClick={() => startEdit(offer)}><Pencil aria-hidden="true" /> Edit</button>
                  <button className="adm-btn-danger" type="button" disabled={busy} onClick={() => {
                    if (window.confirm(`Delete “${offer.title}”? This cannot be undone.`)) void action({ action: "delete", id: offer.id });
                  }}><Trash2 aria-hidden="true" /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
