"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  Rocket,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UtensilsCrossed,
} from "lucide-react";
import { DAY_NAMES, COLOUR_PRESETS } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import type { RestaurantProfileInput } from "@/lib/restaurant";
import type { ImportDraft } from "@/lib/menu-import";

type Day = { closed: boolean; open: string; close: string };
type Hours = Record<string, Day>;

export type SetupInitial = {
  profile: RestaurantProfileInput;
  openingHours: Hours;
  ordering: { leadTimeMinutes: number; slotIntervalMinutes: number; maxDaysAhead: number };
  menuCategoryCount: number;
  setupCompleted: boolean;
};

const STEPS = [
  { id: 1, label: "Restaurant name", icon: Sparkles },
  { id: 2, label: "Logo & colours", icon: ImageIcon },
  { id: 3, label: "Business details", icon: Building2 },
  { id: 4, label: "Opening hours", icon: Clock },
  { id: 5, label: "Collection", icon: ShoppingBag },
  { id: 6, label: "Delivery & payments", icon: Bike },
  { id: 7, label: "Menu categories", icon: UtensilsCrossed },
  { id: 8, label: "Import menu", icon: Upload },
  { id: 9, label: "Launch", icon: Rocket },
] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-charcoal/55">{hint}</span> : null}
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

export function SetupWizard({ initial }: { initial: SetupInitial }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(initial.profile);
  const [hours, setHours] = useState<Hours>(initial.openingHours);
  const [ordering, setOrdering] = useState(initial.ordering);
  const [categories, setCategories] = useState<string[]>(["Starters", "Mains", "Sides", "Desserts", "Drinks"]);
  const [newCategory, setNewCategory] = useState("");
  const [menuChoice, setMenuChoice] = useState<"keep" | "empty" | "categories" | "import">("keep");
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [launched, setLaunched] = useState(false);

  const set = (patch: Partial<RestaurantProfileInput>) => setProfile((p) => ({ ...p, ...patch }));
  const draftItems = useMemo(() => draft?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0, [draft]);

  async function save(complete: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          openingHours: hours,
          ordering,
          complete,
          menuAction: complete ? menuChoice : undefined,
          categoryNames: complete && menuChoice === "categories" ? categories : undefined,
          importDraft:
            complete && menuChoice === "import" && draft
              ? { filename: draft.filename, sourceType: draft.sourceType, mode: "replace", categories: draft.categories }
              : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save. Please check the fields and try again.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save setup.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    if (step === 1 && profile.name.trim().length < 2) return setError("Enter your restaurant name to continue.");
    if (step === 9) return;
    if (await save(false)) setStep((s) => Math.min(9, s + 1));
  }

  async function launch() {
    if (menuChoice === "import" && !draft) return setError("Upload a menu file in step 8, or choose a different menu option.");
    if (await save(true)) setLaunched(true);
  }

  async function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      set({ logoUrl: await fileToDataUrl(file) });
    } catch {
      setError("Could not read that logo file. Try a PNG, JPG or WebP image.");
    }
  }

  async function onMenuFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/admin/menu/import", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { draft?: ImportDraft; error?: string };
      if (!res.ok || !data.draft) throw new Error(data.error || "Could not read that menu file.");
      setDraft(data.draft);
      setMenuChoice("import");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that menu file.");
    } finally {
      setBusy(false);
    }
  }

  if (launched) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-4xl font-semibold">{profile.name} is live!</h1>
        <p className="mt-3 text-charcoal/70">
          Your website, online ordering and table bookings are ready. Sign in to the admin to manage orders, refine
          your menu and explore your dashboards.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-gold">View your website</Link>
          <Link href="/admin" className="btn btn-dark">Open admin dashboard</Link>
          <Link href="/admin/menu" className="btn btn-outline">Manage menu</Link>
        </div>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-left text-sm text-amber-900 ring-1 ring-amber-200">
          Before you share your site: set a strong <code>ADMIN_PASSWORD</code>, connect your domain, and add your
          notification email in Admin → Settings. See <code>docs/onboarding.md</code> for the full checklist.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="text-center">
        <p className="eyebrow-dark">Restaurant Management Platform</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Set up your restaurant</h1>
        <p className="mt-3 text-charcoal/65">Nine short steps. Everything can be changed later in the admin — nothing here needs a developer.</p>
      </header>

      <ol className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-9" aria-label="Setup progress">
        {STEPS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => id < step && setStep(id)}
              className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${id === step ? "bg-charcoal text-cream" : id < step ? "bg-gold/20 text-gold-deep" : "bg-white text-charcoal/45 ring-1 ring-sand"}`}
              aria-current={id === step ? "step" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:block">{label}</span>
              <span className="sm:hidden">{id}</span>
            </button>
          </li>
        ))}
      </ol>

      <section className="card mt-6 p-6 sm:p-8">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 1 — Restaurant name</h2>
            <Field label="Restaurant name *"><input className="input" value={profile.name} maxLength={80} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. The Corner Kitchen" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tagline"><input className="input" value={profile.tagline} maxLength={120} onChange={(e) => set({ tagline: e.target.value })} placeholder="Fresh food, warm welcome" /></Field>
              <Field label="Cuisine"><input className="input" value={profile.cuisine} maxLength={80} onChange={(e) => set({ cuisine: e.target.value })} placeholder="e.g. Italian, Indian, Modern British" /></Field>
            </div>
            <Field label="Homepage headline"><input className="input" value={profile.heroHeadline} maxLength={120} onChange={(e) => set({ heroHeadline: e.target.value })} /></Field>
            <Field label="Homepage introduction"><textarea className="input min-h-20" value={profile.heroSubheadline} maxLength={300} onChange={(e) => set({ heroSubheadline: e.target.value })} /></Field>
            <Field label="About your restaurant (shown on the About page)"><textarea className="input min-h-28" value={profile.aboutText} maxLength={3000} onChange={(e) => set({ aboutText: e.target.value })} /></Field>
            <Field label="Google / search description" hint="Used for SEO and social sharing. Keep it under ~160 characters."><textarea className="input min-h-20" value={profile.description} maxLength={400} onChange={(e) => set({ description: e.target.value })} /></Field>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="font-serif text-3xl font-semibold">Step 2 — Logo &amp; colours</h2>
            <div className="flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.logoUrl || "/images/logo.svg"} alt="Logo preview" className="h-24 w-24 rounded-2xl bg-charcoal object-contain p-1" />
              <div className="space-y-2">
                <label className="adm-btn-primary cursor-pointer">
                  <Upload aria-hidden="true" /> Upload logo
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={onLogo} />
                </label>
                <p className="text-xs text-charcoal/55">PNG with a transparent background works best. It is resized and stored securely with your settings.</p>
              </div>
            </div>
            <Field label="…or logo URL / path"><input className="input" value={profile.logoUrl.startsWith("data:") ? "" : profile.logoUrl} placeholder="https://… or /images/logo.svg" onChange={(e) => set({ logoUrl: e.target.value })} /></Field>
            <Field label="Hero photo URL" hint="The large photo on your homepage. Leave as-is to use the demo photo for now."><input className="input" value={profile.heroImageUrl} onChange={(e) => set({ heroImageUrl: e.target.value })} /></Field>
            <div>
              <span className="label">Brand colours</span>
              <div className="flex flex-wrap gap-2">
                {COLOUR_PRESETS.map((preset) => (
                  <button key={preset.name} type="button" onClick={() => set({ primaryColor: preset.primary, secondaryColor: preset.secondary })}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${profile.primaryColor === preset.primary ? "border-charcoal bg-charcoal text-cream" : "border-sand bg-white"}`}>
                    <span className="flex -space-x-1"><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: preset.primary }} /><span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: preset.secondary }} /></span>
                    {preset.name}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Primary colour"><input type="color" className="input h-12 p-1" value={profile.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} /></Field>
                <Field label="Secondary colour"><input type="color" className="input h-12 p-1" value={profile.secondaryColor} onChange={(e) => set({ secondaryColor: e.target.value })} /></Field>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 3 — Business details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone number *"><input className="input" value={profile.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} /></Field>
              <Field label="Email address"><input className="input" type="email" value={profile.email} onChange={(e) => set({ email: e.target.value })} /></Field>
              <Field label="Street address *"><input className="input" value={profile.street} onChange={(e) => set({ street: e.target.value })} /></Field>
              <Field label="Town / city *"><input className="input" value={profile.locality} onChange={(e) => set({ locality: e.target.value })} /></Field>
              <Field label="County / region"><input className="input" value={profile.region} onChange={(e) => set({ region: e.target.value })} /></Field>
              <Field label="Postcode *"><input className="input" value={profile.postcode} onChange={(e) => set({ postcode: e.target.value })} /></Field>
              <Field label="Facebook page URL"><input className="input" value={profile.facebookUrl} onChange={(e) => set({ facebookUrl: e.target.value })} placeholder="https://facebook.com/…" /></Field>
              <Field label="Instagram URL"><input className="input" value={profile.instagramUrl} onChange={(e) => set({ instagramUrl: e.target.value })} placeholder="https://instagram.com/…" /></Field>
              <Field label="TripAdvisor URL"><input className="input" value={profile.tripadvisorUrl} onChange={(e) => set({ tripadvisorUrl: e.target.value })} /></Field>
              <Field label="Google Place ID" hint="Optional — improves Maps/review links. See docs/domain-setup.md."><input className="input" value={profile.googlePlaceId} onChange={(e) => set({ googlePlaceId: e.target.value })} /></Field>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 4 — Opening hours</h2>
            <p className="text-sm text-charcoal/65">These hours drive your website, collection slots and booking times. Holiday exceptions can be added later in Admin → Restaurant.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead><tr className="text-left text-[11px] tracking-wide text-charcoal/50 uppercase"><th className="py-2">Day</th><th>Closed</th><th>Opens</th><th>Closes</th><th></th></tr></thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                    const key = String(day);
                    const entry = hours[key] ?? { closed: false, open: "12:00", close: "22:00" };
                    return (
                      <tr key={key} className="border-t border-sand">
                        <td className="py-2 font-medium">{DAY_NAMES[day]}</td>
                        <td><input type="checkbox" checked={entry.closed} onChange={(e) => setHours({ ...hours, [key]: { ...entry, closed: e.target.checked } })} aria-label={`${DAY_NAMES[day]} closed`} /></td>
                        <td><input type="time" className="input w-32 py-2" disabled={entry.closed} value={entry.open} onChange={(e) => setHours({ ...hours, [key]: { ...entry, open: e.target.value } })} /></td>
                        <td><input type="time" className="input w-32 py-2" disabled={entry.closed} value={entry.close} onChange={(e) => setHours({ ...hours, [key]: { ...entry, close: e.target.value } })} /></td>
                        <td><button type="button" className="text-xs font-semibold text-gold-deep hover:underline" onClick={() => { const all: Hours = {}; for (let d = 0; d < 7; d += 1) all[String(d)] = { ...entry }; setHours(all); }}>Copy to all days</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 5 — Collection settings</h2>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={profile.collectionEnabled} onChange={(e) => set({ collectionEnabled: e.target.checked })} />
              Accept online collection orders
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Minimum prep time">
                <select className="input" value={ordering.leadTimeMinutes} onChange={(e) => setOrdering({ ...ordering, leadTimeMinutes: Number(e.target.value) })}>
                  {[10, 15, 20, 25, 30, 40, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutes</option>)}
                </select>
              </Field>
              <Field label="Slot interval">
                <select className="input" value={ordering.slotIntervalMinutes} onChange={(e) => setOrdering({ ...ordering, slotIntervalMinutes: Number(e.target.value) })}>
                  {[5, 10, 15, 20, 30].map((m) => <option key={m} value={m}>Every {m} minutes</option>)}
                </select>
              </Field>
              <Field label="Order ahead">
                <select className="input" value={ordering.maxDaysAhead} onChange={(e) => setOrdering({ ...ordering, maxDaysAhead: Number(e.target.value) })}>
                  {[1, 2, 3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d === 1 ? "Today only" : `Up to ${d} days`}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Collection instructions (optional)" hint="Shown to guests, e.g. parking, collection point, or a note about alcohol/corkage.">
              <textarea className="input min-h-20" value={profile.collectionInstructions} maxLength={500} onChange={(e) => set({ collectionInstructions: e.target.value })} />
            </Field>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-5">
            <h2 className="font-serif text-3xl font-semibold">Step 6 — Delivery &amp; payments</h2>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={profile.deliveryEnabled} onChange={(e) => set({ deliveryEnabled: e.target.checked })} />
              Offer delivery via a partner link
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery button label"><input className="input" value={profile.deliveryLabel} onChange={(e) => set({ deliveryLabel: e.target.value })} placeholder="Order Delivery" /></Field>
              <Field label="Delivery URL" hint="Your Deliveroo / Uber Eats / Just Eat page, or your own delivery link."><input className="input" value={profile.deliveryUrl} onChange={(e) => set({ deliveryUrl: e.target.value })} placeholder="https://…" /></Field>
              <Field label="Delivery fee (£)"><input className="input" type="number" min="0" step="0.10" value={(profile.deliveryFeePence / 100).toFixed(2)} onChange={(e) => set({ deliveryFeePence: Math.round(Number(e.target.value || 0) * 100) })} /></Field>
              <Field label="Minimum delivery order (£)"><input className="input" type="number" min="0" step="0.50" value={(profile.deliveryMinOrderPence / 100).toFixed(2)} onChange={(e) => set({ deliveryMinOrderPence: Math.round(Number(e.target.value || 0) * 100) })} /></Field>
            </div>
            <Field label="Delivery notes"><textarea className="input min-h-16" value={profile.deliveryNotes} maxLength={400} onChange={(e) => set({ deliveryNotes: e.target.value })} placeholder="e.g. We deliver within 3 miles, 5–10pm." /></Field>
            <div className="rounded-2xl bg-cream p-4">
              <h3 className="flex items-center gap-2 font-semibold"><CreditCard className="h-5 w-5 text-gold-deep" aria-hidden="true" /> Payments</h3>
              <label className="mt-3 flex items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={profile.payOnCollection} onChange={(e) => set({ payOnCollection: e.target.checked })} />
                Pay on Collection (cash &amp; card in the restaurant)
              </label>
              <label className="mt-2 flex items-center gap-3 text-sm text-charcoal/60">
                <input type="checkbox" checked={profile.payOnlineEnabled} onChange={(e) => set({ payOnlineEnabled: e.target.checked })} />
                Pay Online — <strong>Stripe Coming Soon</strong>
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Stripe publishable key (optional, for later)"><input className="input" value={profile.stripePublishableKey} onChange={(e) => set({ stripePublishableKey: e.target.value })} placeholder="pk_test_…" /></Field>
                <Field label="Stripe mode">
                  <select className="input" value={profile.stripeTestMode ? "test" : "live"} onChange={(e) => set({ stripeTestMode: e.target.value === "test" })}>
                    <option value="test">Test mode</option><option value="live">Live mode</option>
                  </select>
                </Field>
              </div>
              <p className="mt-2 text-xs text-charcoal/55">Online checkout is not active yet — your keys are stored ready for the Stripe integration. Secret keys are never stored here (environment only).</p>
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 7 — Create menu categories</h2>
            <p className="text-sm text-charcoal/65">Categories organise your menu (Starters, Mains…). You can rename, reorder or add more at any time in Admin → Menu.</p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((name) => (
                <li key={name} className="inline-flex items-center gap-2 rounded-full bg-cream-dark py-1.5 pr-2 pl-4 text-sm font-semibold">
                  {name}
                  <button type="button" aria-label={`Remove ${name}`} onClick={() => setCategories(categories.filter((c) => c !== name))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-white"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input className="input" value={newCategory} placeholder="New category name" onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = newCategory.trim(); if (v && !categories.includes(v)) setCategories([...categories, v]); setNewCategory(""); } }} />
              <button type="button" className="btn btn-dark shrink-0" onClick={() => { const v = newCategory.trim(); if (v && !categories.includes(v)) setCategories([...categories, v]); setNewCategory(""); }}>Add</button>
            </div>
          </div>
        ) : null}

        {step === 8 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 8 — Import menu</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Menu starting point">
              {(
                [
                  ["import", "Upload my menu", "CSV, Excel or PDF — we create categories, dishes and prices for you to review."],
                  ["keep", "Start from the demo menu", "Keep the sample dishes and edit them in the admin. Fastest way to explore."],
                  ["categories", "My categories, empty menu", "Create the categories from step 7 and add dishes in Admin → Menu."],
                  ["empty", "Completely empty", "Start with a blank menu."],
                ] as const
              ).map(([value, title, text]) => (
                <label key={value} className={`cursor-pointer rounded-2xl border p-4 ${menuChoice === value ? "border-charcoal bg-cream" : "border-sand bg-white"}`}>
                  <span className="flex items-center gap-2 font-semibold"><input type="radio" name="menu-choice" checked={menuChoice === value} onChange={() => setMenuChoice(value)} /> {title}</span>
                  <span className="mt-1 block text-sm text-charcoal/65">{text}</span>
                </label>
              ))}
            </div>
            <label className="adm-btn-primary w-fit cursor-pointer">
              <Upload aria-hidden="true" /> {draft ? "Replace menu file" : "Upload CSV / Excel / PDF"}
              <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls,.pdf" className="sr-only" onChange={onMenuFile} />
            </label>
            <p className="text-xs text-charcoal/55">Tip: the CSV template (Category, Name, Description, Price, Dietary, Featured) imports most reliably. PDFs are best-effort — you will review everything below and again in Admin → Menu before guests order.</p>
            {draft ? (
              <div className="rounded-2xl border border-sand p-4">
                <p className="font-semibold">{draft.filename} — {draft.categories.length} categories, {draftItems} dishes found</p>
                {draft.warnings.map((w) => <p key={w} className="mt-1 text-xs text-amber-800">{w}</p>)}
                <div className="mt-3 max-h-64 space-y-3 overflow-y-auto text-sm">
                  {draft.categories.map((c) => (
                    <div key={c.name}>
                      <p className="font-semibold">{c.name}</p>
                      <ul className="text-charcoal/70">{c.items.slice(0, 6).map((i) => <li key={i.name} className="flex justify-between gap-3"><span>{i.name}</span><span>{formatPrice(i.pricePence)}</span></li>)}{c.items.length > 6 ? <li>…and {c.items.length - 6} more</li> : null}</ul>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-charcoal/55">This publishes on Launch (step 9). You can fine-tune every dish in Admin → Menu afterwards.</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 9 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-3xl font-semibold">Step 9 — Launch your website</h2>
            <dl className="grid gap-3 rounded-2xl bg-cream p-5 text-sm sm:grid-cols-2">
              <div><dt className="text-charcoal/55">Restaurant</dt><dd className="font-semibold">{profile.name}</dd></div>
              <div><dt className="text-charcoal/55">Address</dt><dd className="font-semibold">{profile.street}, {profile.locality}, {profile.postcode}</dd></div>
              <div><dt className="text-charcoal/55">Phone</dt><dd className="font-semibold">{profile.phoneDisplay}</dd></div>
              <div><dt className="text-charcoal/55">Collection</dt><dd className="font-semibold">{profile.collectionEnabled ? `On — from ${ordering.leadTimeMinutes} min, pay on collection` : "Off"}</dd></div>
              <div><dt className="text-charcoal/55">Delivery</dt><dd className="font-semibold">{profile.deliveryEnabled && profile.deliveryUrl ? profile.deliveryLabel : "Not linked"}</dd></div>
              <div><dt className="text-charcoal/55">Menu</dt><dd className="font-semibold">{menuChoice === "import" && draft ? `${draftItems} imported dishes` : menuChoice === "keep" ? "Demo menu (edit in admin)" : menuChoice === "categories" ? `${categories.length} empty categories` : "Empty"}</dd></div>
            </dl>
            <ul className="space-y-2 text-sm text-charcoal/70">
              <li>✓ Orders and bookings appear instantly in your admin dashboard.</li>
              <li>✓ Customers pay on collection — online Stripe payment can be switched on later.</li>
              <li>○ Next: set your notification email (Admin → Settings) and connect your domain (docs/domain-setup.md).</li>
            </ul>
            <button type="button" onClick={launch} disabled={busy} className="btn btn-gold w-full py-4 text-base">
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Rocket aria-hidden="true" />} Launch website
            </button>
          </div>
        ) : null}

        {error ? <p role="alert" className="mt-5 rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">{error}</p> : null}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" className="btn btn-outline" disabled={step === 1 || busy} onClick={() => setStep((s) => Math.max(1, s - 1))}>
            <ArrowLeft aria-hidden="true" /> Back
          </button>
          <span className="text-xs text-charcoal/50">Step {step} of 9 · progress is saved as you go</span>
          {step < 9 ? (
            <button type="button" className="btn btn-dark" disabled={busy} onClick={next}>
              {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null} Save &amp; continue <ArrowRight aria-hidden="true" />
            </button>
          ) : <span />}
        </div>
      </section>
      <p className="mt-4 text-center text-xs text-charcoal/50">Already launched? <Link href="/admin" className="font-semibold underline">Go to the admin dashboard</Link></p>
    </div>
  );
}
