"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Upload } from "lucide-react";
import type { RestaurantProfileInput } from "@/lib/restaurant";
import { COLOUR_PRESETS } from "@/lib/site";
import { Notice, Toggle, useNotice } from "../AdminUI";

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

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="adm-label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-black/50">{hint}</span> : null}
    </label>
  );
}

async function fileToDataUrl(file: File, maxSize = 512): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/webp", 0.9);
}

export function BusinessProfileForm({ initial }: { initial: RestaurantProfileInput }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [galleryText, setGalleryText] = useState(initial.galleryImages.join("\n"));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useNotice();
  const set = (patch: Partial<RestaurantProfileInput>) => setForm((f) => ({ ...f, ...patch }));

  async function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set({ logoUrl: await fileToDataUrl(file) });
    } catch {
      setNotice({ type: "error", text: "Could not read that logo file." });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: RestaurantProfileInput = {
        ...form,
        galleryImages: galleryText.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12),
        geoLat: form.geoLat === null || Number.isNaN(form.geoLat) ? null : form.geoLat,
        geoLng: form.geoLng === null || Number.isNaN(form.geoLng) ? null : form.geoLng,
      };
      const res = await fetch("/api/admin/restaurant-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save business settings");
      setNotice({ type: "ok", text: "Business settings saved — the website has been updated" });
      router.refresh();
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "Could not save business settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Section title="Restaurant identity" description="Name, tagline and the words guests (and Google) see first.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Restaurant name"><input className="adm-input" value={form.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Tagline"><input className="adm-input" value={form.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} /></Field>
          <Field label="Cuisine"><input className="adm-input" value={form.cuisine} maxLength={80} onChange={(e) => set({ cuisine: e.target.value })} /></Field>
          <Field label="Homepage headline"><input className="adm-input" value={form.heroHeadline} maxLength={120} onChange={(e) => set({ heroHeadline: e.target.value })} /></Field>
        </div>
        <Field label="Homepage introduction"><textarea className="adm-input min-h-16" value={form.heroSubheadline} maxLength={300} onChange={(e) => set({ heroSubheadline: e.target.value })} /></Field>
        <Field label="About text" hint="Shown on the About page and homepage welcome section. Separate paragraphs with a blank line."><textarea className="adm-input min-h-28" value={form.aboutText} maxLength={3000} onChange={(e) => set({ aboutText: e.target.value })} /></Field>
        <Field label="SEO / social description"><textarea className="adm-input min-h-16" value={form.description} maxLength={400} onChange={(e) => set({ description: e.target.value })} /></Field>
      </Section>

      <Section title="Logo, photos & colours" description="Your brand. Colours update buttons, headings and accents across the whole site instantly.">
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.logoUrl || "/images/logo.svg"} alt="Current logo" className="h-20 w-20 rounded-2xl bg-charcoal object-contain p-1" />
          <label className="adm-btn cursor-pointer">
            <Upload aria-hidden="true" /> Upload new logo
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={onLogo} />
          </label>
        </div>
        <Field label="Logo URL / path"><input className="adm-input" value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl} placeholder={form.logoUrl.startsWith("data:") ? "Using uploaded logo" : "https://… or /images/logo.svg"} onChange={(e) => set({ logoUrl: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Hero photo URL"><input className="adm-input" value={form.heroImageUrl} onChange={(e) => set({ heroImageUrl: e.target.value })} /></Field>
          <Field label="About photo URL"><input className="adm-input" value={form.aboutImageUrl} onChange={(e) => set({ aboutImageUrl: e.target.value })} /></Field>
        </div>
        <Field label="Gallery photo URLs (one per line, up to 12)"><textarea className="adm-input min-h-24 font-mono text-xs" value={galleryText} onChange={(e) => setGalleryText(e.target.value)} /></Field>
        <div>
          <span className="adm-label">Colour presets</span>
          <div className="flex flex-wrap gap-2">
            {COLOUR_PRESETS.map((preset) => (
              <button key={preset.name} type="button" onClick={() => set({ primaryColor: preset.primary, secondaryColor: preset.secondary })}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${form.primaryColor === preset.primary ? "border-black bg-black text-white" : "border-black/15 bg-white"}`}>
                <span className="flex -space-x-1"><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: preset.primary }} /><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: preset.secondary }} /></span>
                {preset.name}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Primary colour"><input type="color" className="adm-input h-11 p-1" value={form.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} /></Field>
            <Field label="Secondary colour"><input type="color" className="adm-input h-11 p-1" value={form.secondaryColor} onChange={(e) => set({ secondaryColor: e.target.value })} /></Field>
          </div>
        </div>
      </Section>

      <Section title="Contact & social" description="Shown in the header, footer, contact page, emails and Google structured data.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone number"><input className="adm-input" value={form.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} /></Field>
          <Field label="Email address"><input className="adm-input" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Street"><input className="adm-input" value={form.street} onChange={(e) => set({ street: e.target.value })} /></Field>
          <Field label="Town / city"><input className="adm-input" value={form.locality} onChange={(e) => set({ locality: e.target.value })} /></Field>
          <Field label="County / region"><input className="adm-input" value={form.region} onChange={(e) => set({ region: e.target.value })} /></Field>
          <Field label="Postcode"><input className="adm-input" value={form.postcode} onChange={(e) => set({ postcode: e.target.value })} /></Field>
          <Field label="Facebook URL"><input className="adm-input" value={form.facebookUrl} onChange={(e) => set({ facebookUrl: e.target.value })} /></Field>
          <Field label="Instagram URL"><input className="adm-input" value={form.instagramUrl} onChange={(e) => set({ instagramUrl: e.target.value })} /></Field>
          <Field label="TripAdvisor URL"><input className="adm-input" value={form.tripadvisorUrl} onChange={(e) => set({ tripadvisorUrl: e.target.value })} /></Field>
          <Field label="Google Place ID"><input className="adm-input" value={form.googlePlaceId} onChange={(e) => set({ googlePlaceId: e.target.value })} /></Field>
          <Field label="Latitude (optional)"><input className="adm-input" type="number" step="any" value={form.geoLat ?? ""} onChange={(e) => set({ geoLat: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          <Field label="Longitude (optional)"><input className="adm-input" type="number" step="any" value={form.geoLng ?? ""} onChange={(e) => set({ geoLng: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
        </div>
      </Section>

      <Section title="Collection & delivery" description="How guests order. Collection uses the built-in ordering system; delivery links out to your partner.">
        <div className="flex items-center gap-3">
          <Toggle checked={form.collectionEnabled} onChange={(v) => set({ collectionEnabled: v })} label="Collection ordering enabled" />
          <span className="text-sm font-semibold">Collection ordering {form.collectionEnabled ? "on" : "off"}</span>
        </div>
        <Field label="Collection instructions"><textarea className="adm-input min-h-16" value={form.collectionInstructions} maxLength={500} onChange={(e) => set({ collectionInstructions: e.target.value })} /></Field>
        <div className="flex items-center gap-3">
          <Toggle checked={form.deliveryEnabled} onChange={(v) => set({ deliveryEnabled: v })} label="Delivery enabled" />
          <span className="text-sm font-semibold">Delivery button {form.deliveryEnabled ? "shown (needs a URL)" : "hidden"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Delivery button label"><input className="adm-input" value={form.deliveryLabel} onChange={(e) => set({ deliveryLabel: e.target.value })} /></Field>
          <Field label="Delivery URL"><input className="adm-input" value={form.deliveryUrl} onChange={(e) => set({ deliveryUrl: e.target.value })} placeholder="https://…" /></Field>
          <Field label="Delivery fee (£)"><input className="adm-input" type="number" min="0" step="0.10" value={(form.deliveryFeePence / 100).toFixed(2)} onChange={(e) => set({ deliveryFeePence: Math.round(Number(e.target.value || 0) * 100) })} /></Field>
          <Field label="Minimum delivery order (£)"><input className="adm-input" type="number" min="0" step="0.50" value={(form.deliveryMinOrderPence / 100).toFixed(2)} onChange={(e) => set({ deliveryMinOrderPence: Math.round(Number(e.target.value || 0) * 100) })} /></Field>
        </div>
        <Field label="Delivery notes"><textarea className="adm-input min-h-16" value={form.deliveryNotes} maxLength={400} onChange={(e) => set({ deliveryNotes: e.target.value })} /></Field>
      </Section>

      <Section title="Payments" description="Pay on Collection works today. Online card payment (Stripe) is architected and ready to switch on — checkout is not active yet.">
        <div className="flex items-center gap-3">
          <Toggle checked={form.payOnCollection} onChange={(v) => set({ payOnCollection: v })} label="Pay on collection" />
          <span className="text-sm font-semibold">Pay on Collection {form.payOnCollection ? "— active" : "— off"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Toggle checked={form.payOnlineEnabled} onChange={(v) => set({ payOnlineEnabled: v })} label="Pay online" />
          <span className="flex items-center gap-2 text-sm font-semibold">Pay Online <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">Stripe — Coming Soon</span></span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Stripe publishable key" hint="Safe to store here. Your secret key must only ever be set as the STRIPE_SECRET_KEY environment variable.">
            <input className="adm-input" value={form.stripePublishableKey} onChange={(e) => set({ stripePublishableKey: e.target.value })} placeholder="pk_test_…" />
          </Field>
          <Field label="Stripe mode">
            <select className="adm-input" value={form.stripeTestMode ? "test" : "live"} onChange={(e) => set({ stripeTestMode: e.target.value === "test" })}>
              <option value="test">Test mode</option>
              <option value="live">Live mode</option>
            </select>
          </Field>
        </div>
        <p className="flex gap-2 rounded-xl bg-cream p-3 text-sm text-black/65">
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Every order already records its payment method and status, so enabling Stripe later needs no data migration. See docs/architecture.md → Payments roadmap.
        </p>
        <div className="flex items-center gap-3">
          <Toggle checked={form.setupCompleted} onChange={(v) => set({ setupCompleted: v })} label="Setup completed" />
          <span className="text-sm">Setup completed {form.setupCompleted ? "(wizard locked for guests)" : "(wizard open at /setup)"}</span>
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" className="adm-btn-primary px-6 py-3 text-base shadow-xl" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Save business settings
        </button>
      </div>
      <Notice notice={notice} onClose={() => setNotice(null)} />
    </form>
  );
}
