"use client";

import { useEffect, useState } from "react";
import type { RestaurantConfig } from "@/lib/restaurant";

type Props = {
  initialConfig: RestaurantConfig | null;
  token?: string;
};

const STEPS = [
  { id: 1, title: "Business & Branding" },
  { id: 2, title: "Hours & Ordering" },
  { id: 3, title: "Local SEO" },
  { id: 4, title: "Menu & Allergens" },
  { id: 5, title: "Pictures" },
  { id: 6, title: "Check & Go Live" },
] as const;

export function SetupWizard({ initialConfig, token }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [restaurantName, setRestaurantName] = useState(initialConfig?.restaurantName ?? "Thai Courtyard");
  const [fullName, setFullName] = useState(initialConfig?.fullName ?? "Thai Courtyard East Molesey");
  const [tagline, setTagline] = useState(initialConfig?.tagline ?? "Authentic Thai Cuisine in the Heart of East Molesey");
  const [description, setDescription] = useState(initialConfig?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initialConfig?.shortDescription ?? "");
  const [street, setStreet] = useState(initialConfig?.addressStreet ?? "105 Walton Road");
  const [locality, setLocality] = useState(initialConfig?.addressLocality ?? "East Molesey");
  const [region, setRegion] = useState(initialConfig?.addressRegion ?? "Surrey");
  const [postcode, setPostcode] = useState(initialConfig?.addressPostcode ?? "KT8 0DR");
  const [phoneDisplay, setPhoneDisplay] = useState(initialConfig?.phoneDisplay ?? "020 8941 3595");
  const [phoneIntl, setPhoneIntl] = useState(initialConfig?.phoneIntl ?? "+44 20 8941 3595");
  const [email, setEmail] = useState(initialConfig?.email ?? "info@thaicourtyardmolesey.co.uk");
  const [deliverooUrl, setDeliverooUrl] = useState(initialConfig?.deliverooUrl ?? "");
  const [googlePlaceId, setGooglePlaceId] = useState(initialConfig?.googlePlaceId ?? "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialConfig?.googleReviewUrl ?? "");
  const [themePrimary, setThemePrimary] = useState(initialConfig?.themePrimary ?? "#1a2a3a");
  const [themeAccent, setThemeAccent] = useState(initialConfig?.themeAccent ?? "#c9a86a");
  const [fontPreset, setFontPreset] = useState(initialConfig?.fontPreset ?? "serif-sans");
  const [siteUrl, setSiteUrl] = useState(initialConfig?.siteUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://www.thaicourtyardmolesey.co.uk"));

  // Step 2
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string } | null>>(
    (initialConfig?.openingHours as Record<string, { open: string; close: string } | null>) ?? {
      "0": null,
      "1": null,
      "2": { open: "12:00", close: "21:00" },
      "3": { open: "12:00", close: "21:00" },
      "4": { open: "12:00", close: "21:00" },
      "5": { open: "12:00", close: "21:00" },
      "6": { open: "12:00", close: "21:00" },
    },
  );
  const [slotInterval, setSlotInterval] = useState(String(initialConfig?.slotIntervalMinutes ?? 15));
  const [leadTime, setLeadTime] = useState(String(initialConfig?.leadTimeMinutes ?? 20));
  const [maxDaysAhead, setMaxDaysAhead] = useState(String(initialConfig?.maxDaysAhead ?? 7));
  const [paymentNotice, setPaymentNotice] = useState(initialConfig?.paymentNotice ?? "Payment will be taken in restaurant when you collect your order. We accept cash and card.");
  const [announcement, setAnnouncement] = useState(initialConfig?.announcement ?? "");
  const [paymentMode, setPaymentMode] = useState<string>((initialConfig as unknown as { paymentMode?: string })?.paymentMode ?? "pay_on_collection");

  // Step 3
  const [areaServed, setAreaServed] = useState<string[]>(initialConfig?.areaServed ?? ["East Molesey", "Hampton Court", "Thames Ditton"]);
  const [areaInput, setAreaInput] = useState("");

  // Step 4
  const [menuJson, setMenuJson] = useState("");
  const [menuFileName, setMenuFileName] = useState<string | null>(null);

  // Step 5
  const [logoUrl, setLogoUrl] = useState(initialConfig?.logoUrl ?? "/images/logo.png");
  const [heroImageUrl, setHeroImageUrl] = useState(initialConfig?.heroImageUrl ?? "/images/hero-spread.jpg");
  const [ogImageUrl, setOgImageUrl] = useState(initialConfig?.ogImageUrl ?? "/opengraph-image");
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialConfig?.galleryUrls ?? []);

  // Step 6
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [diagLoading, setDiagLoading] = useState(false);

  async function save(partial: Record<string, unknown>, msg = "Saved") {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-setup-token": token } : {}) },
        body: JSON.stringify({ ...partial, token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Save failed");
      setNotice(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleStep1() {
    await save(
      {
        step: 1,
        restaurantName,
        fullName,
        tagline,
        description,
        shortDescription,
        addressStreet: street,
        addressLocality: locality,
        addressRegion: region,
        addressPostcode: postcode,
        phoneDisplay,
        phoneIntl,
        email,
        deliverooUrl,
        googlePlaceId,
        googleReviewUrl,
        themePrimary,
        themeAccent,
        fontPreset,
        siteUrl,
      },
      "Business details saved",
    );
    setStep(2);
  }

  async function handleStep2() {
    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "x-setup-token": token } : {}) },
      body: JSON.stringify({
        step: 2,
        openingHours,
        slotIntervalMinutes: Number(slotInterval),
        leadTimeMinutes: Number(leadTime),
        maxDaysAhead: Number(maxDaysAhead),
        paymentNotice,
        announcement: announcement || null,
        paymentMode,
        token,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Save failed — if Stripe mode was chosen, check Stripe keys");
      return;
    }
    setNotice("Hours & ordering saved");
    setStep(3);
  }

  async function handleStep3() {
    await save({ step: 3, areaServed }, "Local SEO saved");
    setStep(4);
  }

  async function handleMenuUpload() {
    if (!menuJson.trim() && !menuFileName) {
      setError("Paste a menu JSON or upload a CSV/JSON file");
      return;
    }
    // Try to parse as JSON; if CSV, we will send raw for server to handle
    let parsed: unknown = null;
    let isCsv = false;
    try {
      parsed = JSON.parse(menuJson);
    } catch {
      if (menuJson.includes(",") && menuJson.includes("\n")) isCsv = true;
      else if (menuFileName?.endsWith(".csv")) isCsv = true;
    }
    await save({ step: 4, menuPayload: menuJson, isCsv, parsed }, "Menu processed — allergens auto-filled, review in Admin → Menu");
    setStep(5);
  }

  async function handleStep5() {
    await save({ step: 5, logoUrl, heroImageUrl, ogImageUrl, galleryUrls }, "Pictures saved");
    setStep(6);
  }

  async function runDiagnostics() {
    setDiagLoading(true);
    try {
      const res = await fetch(`/api/setup/diagnostics${token ? `?token=${encodeURIComponent(token)}` : ""}`, {
        headers: token ? { "x-setup-token": token } : {},
      });
      const data = (await res.json()) as Record<string, unknown>;
      setDiagnostics(data);
    } catch (e) {
      setDiagnostics({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      setDiagLoading(false);
    }
  }

  useEffect(() => {
    if (step === 6) runDiagnostics();
  }, [step]);

  async function sendTestEmail() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-setup-token": token } : {}) },
        body: JSON.stringify({ token, to: email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Email failed");
      setNotice(data.message || "Test email sent — check inbox (and spam)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Email failed");
    } finally {
      setSaving(false);
    }
  }

  async function completeSetup() {
    if (adminPassword.length < 8) {
      setError("Admin password must be at least 8 characters");
      return;
    }
    if (adminPassword !== adminPasswordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-setup-token": token } : {}) },
        body: JSON.stringify({ token, adminPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Complete failed");
      setNotice("Setup completed — wizard is now locked. Go to /admin to manage your restaurant.");
      setTimeout(() => (window.location.href = "/admin"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Complete failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadViaBlob(file: File, setter: (url: string) => void) {
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/blob/upload${token ? `?token=${encodeURIComponent(token)}` : ""}`, {
        method: "POST",
        headers: token ? { "x-setup-token": token } : {},
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed — check BLOB_READ_WRITE_TOKEN");
      setter(data.url);
      setNotice(`Uploaded ${file.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  const days = [
    [0, "Sunday"],
    [1, "Monday"],
    [2, "Tuesday"],
    [3, "Wednesday"],
    [4, "Thursday"],
    [5, "Friday"],
    [6, "Saturday"],
  ] as const;

  return (
    <div className="container-x py-6 sm:py-8">
      <ol className="flex flex-wrap gap-1.5 sm:gap-2">
        {STEPS.map((s) => (
          <li key={s.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${step === s.id ? "bg-charcoal text-cream ring-charcoal" : step > s.id ? "bg-jade/10 text-jade ring-jade/20" : "bg-white text-charcoal/60 ring-sand"}`}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[11px]">{s.id}</span>
            {s.title}
          </li>
        ))}
      </ol>

      {notice ? <p className="mt-4 rounded-lg bg-jade/10 p-3 text-sm text-jade ring-1 ring-jade/20">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{error}</p> : null}

      <div className="mt-6 rounded-2xl border border-sand bg-white p-5 shadow-sm sm:p-6">
        {step === 1 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 1 — Business Details & Branding</h2>
            <p className="text-sm text-charcoal/60">This replaces every hardcoded Thai Courtyard string (name, address, phone, Deliveroo, Google links, colours, fonts).</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold">Restaurant name *</span>
                <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Full name</span>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">Tagline</span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">Description (SEO)</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">Short description</span>
                <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Street</span>
                <input value={street} onChange={(e) => setStreet(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Locality / Town</span>
                <input value={locality} onChange={(e) => setLocality(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Region</span>
                <input value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Postcode</span>
                <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Phone (display)</span>
                <input value={phoneDisplay} onChange={(e) => setPhoneDisplay(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Phone (intl)</span>
                <input value={phoneIntl} onChange={(e) => setPhoneIntl(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Contact email *</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Canonical site URL *</span>
                <input value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://www.example.co.uk" className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Deliveroo URL</span>
                <input value={deliverooUrl} onChange={(e) => setDeliverooUrl(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Google Place ID (optional)</span>
                <input value={googlePlaceId} onChange={(e) => setGooglePlaceId(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold">Google Review URL (or leave blank to auto-generate)</span>
                <input value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Primary colour</span>
                <input type="color" value={themePrimary} onChange={(e) => setThemePrimary(e.target.value)} className="h-10 w-full rounded-lg border border-sand p-1" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Accent colour</span>
                <input type="color" value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)} className="h-10 w-full rounded-lg border border-sand p-1" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Font preset</span>
                <select value={fontPreset} onChange={(e) => setFontPreset(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2">
                  <option value="serif-sans">Serif + Sans (default)</option>
                  <option value="sans">Sans only</option>
                  <option value="display">Display serif</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleStep1} disabled={saving} className="btn btn-dark">
                {saving ? "Saving…" : "Save & continue →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 2 — Opening Hours & Ordering Rules</h2>
            <div className="grid gap-2">
              {days.map(([id, label]) => (
                <div key={id} className="flex flex-wrap items-center gap-2 rounded-lg border border-sand px-3 py-2">
                  <span className="w-24 text-sm font-semibold">{label}</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={openingHours[String(id)] !== null}
                      onChange={(e) => setOpeningHours((h) => ({ ...h, [String(id)]: e.target.checked ? { open: "12:00", close: "21:00" } : null }))}
                    />
                    Open
                  </label>
                  {openingHours[String(id)] ? (
                    <>
                      <input
                        type="time"
                        value={openingHours[String(id)]!.open}
                        onChange={(e) => setOpeningHours((h) => ({ ...h, [String(id)]: { open: e.target.value, close: h[String(id)]!.close } }))}
                        className="rounded border border-sand px-2 py-1 text-xs"
                      />
                      <span className="text-xs">—</span>
                      <input
                        type="time"
                        value={openingHours[String(id)]!.close}
                        onChange={(e) => setOpeningHours((h) => ({ ...h, [String(id)]: { open: h[String(id)]!.open, close: e.target.value } }))}
                        className="rounded border border-sand px-2 py-1 text-xs"
                      />
                    </>
                  ) : (
                    <span className="text-xs text-charcoal/50">Closed</span>
                  )}
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-semibold">Slot interval (min)</span>
                <input type="number" value={slotInterval} onChange={(e) => setSlotInterval(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Lead time (min)</span>
                <input type="number" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold">Max days ahead</span>
                <input type="number" value={maxDaysAhead} onChange={(e) => setMaxDaysAhead(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
              </label>
            </div>
            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="text-sm font-semibold">Payment mode for collection orders</p>
              <p className="mt-1 text-xs text-charcoal/60">Pay on collection is the default — no Stripe needed. Choose Stripe online or let the customer choose at checkout.</p>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="mt-2 w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm">
                <option value="pay_on_collection">Pay on collection (default — no Stripe)</option>
                <option value="stripe_online">Pay online now (Stripe Checkout — all orders)</option>
                <option value="customer_choice">Customer chooses at checkout (Pay on collection or Pay online)</option>
              </select>
              {paymentMode !== "pay_on_collection" ? (
                <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 ring-1 ring-amber-200">Stripe mode selected — set <code>STRIPE_SECRET_KEY</code>, <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code> in Vercel + <code>.env.local</code>. Without them checkout will return a clear error and orders stay on Pay on collection. Diagnostics in Step 6 validates them.</p>
              ) : null}
            </div>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Payment notice</span>
              <input value={paymentNotice} onChange={(e) => setPaymentNotice(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Announcement (optional, shown as banner)</span>
              <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="e.g. Bank Holiday hours..." className="w-full rounded-lg border border-sand px-3 py-2" />
            </label>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="btn btn-outline">
                ← Back
              </button>
              <button onClick={handleStep2} disabled={saving} className="btn btn-dark">
                {saving ? "Saving…" : "Save & continue →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 3 — Local SEO & Area Pages</h2>
            <p className="text-sm text-charcoal/60">Replaces the hardcoded 11 East Molesey/Hampton Court areas. These feed the footer strip, LocalBusiness schema and sitemap.</p>
            <div className="flex flex-wrap gap-2 rounded-xl bg-cream p-3">
              {areaServed.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-sand">
                  {a}
                  <button onClick={() => setAreaServed((list) => list.filter((x) => x !== a))} className="ml-1 text-charcoal/50 hover:text-red-600">
                    ×
                  </button>
                </span>
              ))}
              <input
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && areaInput.trim()) {
                    e.preventDefault();
                    setAreaServed((l) => [...l, areaInput.trim()]);
                    setAreaInput("");
                  }
                }}
                placeholder="Add area & press Enter"
                className="min-w-40 flex-1 rounded-full border border-sand bg-white px-3 py-1 text-xs"
              />
              <button onClick={() => { if (areaInput.trim()) { setAreaServed((l) => [...l, areaInput.trim()]); setAreaInput(""); } }} className="rounded-full bg-charcoal px-3 py-1 text-xs font-semibold text-cream">
                Add
              </button>
            </div>
            <p className="text-xs text-charcoal/50">Main town is taken from Step 1 Locality ({locality}); areaServed list is used for JSON-LD areaServed, footer, and auto-titles.</p>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="btn btn-outline">
                ← Back
              </button>
              <button onClick={handleStep3} disabled={saving} className="btn btn-dark">
                {saving ? "Saving…" : "Save & continue →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 4 — Menu Upload & Allergen Auto-Fill</h2>
            <p className="text-sm text-charcoal/60">Upload a CSV or JSON menu file. Definite 14 UK FSA allergens are auto-filled and editable in Admin → Menu afterwards.</p>
            <div className="flex flex-wrap gap-2">
              <a href="/sample-menu.csv" download className="btn btn-outline text-xs">
                Download sample CSV
              </a>
              <a href="/sample-menu.json" download className="btn btn-outline text-xs">
                Download sample JSON
              </a>
            </div>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Upload CSV/JSON file</span>
              <input
                type="file"
                accept=".csv,.json"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setMenuFileName(f.name);
                  const text = await f.text();
                  setMenuJson(text);
                }}
                className="w-full rounded-lg border border-sand px-3 py-2 text-sm"
              />
              {menuFileName ? <span className="text-xs text-charcoal/60">Selected: {menuFileName}</span> : null}
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold">Or paste menu JSON / CSV here (bulk editor)</span>
              <textarea value={menuJson} onChange={(e) => setMenuJson(e.target.value)} rows={10} placeholder='{"categories": [{"name":"Starters","items":[{"name":"Pad Thai","price":1200}]}]} or CSV' className="w-full rounded-lg border border-sand px-3 py-2 font-mono text-xs" />
            </label>
            <p className="text-xs text-charcoal/50">CSV columns: category, name, description, price (pence or £), dietary (vegan/vegetarian...), groups. JSON is validated with zod.</p>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(3)} className="btn btn-outline">
                ← Back
              </button>
              <button onClick={handleMenuUpload} disabled={saving} className="btn btn-dark">
                {saving ? "Processing…" : "Process menu & continue →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 5 — Picture Uploads (Persistent Storage)</h2>
            <p className="text-sm text-charcoal/60">
              Uses <code>@vercel/blob</code> via <code>BLOB_READ_WRITE_TOKEN</code>. If the token is missing, you’ll see a clear error — uploads are blocked until it’s set in Vercel → Storage → Blob.
            </p>
            {[
              ["Logo", logoUrl, setLogoUrl],
              ["Hero image", heroImageUrl, setHeroImageUrl],
              ["OG social card", ogImageUrl, setOgImageUrl],
            ].map(([label, url, setter]) => (
              <div key={label as string} className="rounded-xl border border-sand p-4">
                <p className="text-sm font-semibold">{label as string}</p>
                <p className="mt-1 break-all text-xs text-charcoal/60">{url as string}</p>
                {typeof url === "string" && url.startsWith("http") ? <img src={url as string} alt={label as string} className="mt-2 h-20 rounded object-cover" /> : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadViaBlob(f, setter as (v: string) => void);
                  }}
                  className="mt-2 w-full rounded-lg border border-sand px-3 py-2 text-xs"
                />
              </div>
            ))}
            <div className="rounded-xl border border-sand p-4">
              <p className="text-sm font-semibold">Gallery / photo-band URLs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {galleryUrls.map((u, i) => (
                  <span key={i} className="inline-flex max-w-[260px] items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs">
                    <span className="truncate">{u}</span>
                    <button onClick={() => setGalleryUrls((a) => a.filter((_, idx) => idx !== i))} className="text-charcoal/50">
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  for (const f of files) await uploadViaBlob(f, (url) => setGalleryUrls((a) => [...a, url]));
                }}
                className="mt-2 w-full rounded-lg border border-sand px-3 py-2 text-xs"
              />
              <p className="mt-1 text-xs text-charcoal/50">Or paste a URL and press Enter — multiple allowed.</p>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(4)} className="btn btn-outline">
                ← Back
              </button>
              <button onClick={handleStep5} disabled={saving} className="btn btn-dark">
                {saving ? "Saving…" : "Save & continue →"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Step 6 — Vercel, Database & Email Check + Go Live</h2>
            <button onClick={runDiagnostics} disabled={diagLoading} className="btn btn-outline text-xs">
              {diagLoading ? "Checking…" : "↻ Re-run diagnostics"}
            </button>
            {diagnostics ? (
              <pre className="max-h-64 overflow-auto rounded-xl bg-charcoal p-4 text-xs leading-relaxed text-cream">{JSON.stringify(diagnostics, null, 2)}</pre>
            ) : (
              <p className="text-sm text-charcoal/60">Run diagnostics to verify DATABASE_URL, BLOB token, SMTP, and NEXT_PUBLIC_SITE_URL.</p>
            )}
            <button onClick={sendTestEmail} disabled={saving} className="btn btn-outline text-xs">
              Send Test Email to {email}
            </button>
            <div className="rounded-xl border border-sand p-4">
              <h3 className="font-semibold">Set Admin password</h3>
              <p className="text-xs text-charcoal/60">This hash is stored in Postgres (`restaurant_config.admin_password_hash`). `ADMIN_PASSWORD` env remains as fallback.</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold">New admin password *</span>
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold">Confirm *</span>
                  <input type="password" value={adminPasswordConfirm} onChange={(e) => setAdminPasswordConfirm(e.target.value)} className="w-full rounded-lg border border-sand px-3 py-2" />
                </label>
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" required className="mt-0.5" />
              I confirm details are correct and I’m ready to launch.
            </label>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(5)} className="btn btn-outline">
                ← Back
              </button>
              <button onClick={completeSetup} disabled={saving} className="btn btn-dark bg-jade">
                {saving ? "Launching…" : "Complete Setup & Launch 🔒"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {STEPS.map((s) => (
          <span key={s.id} className={`h-1.5 w-8 rounded-full ${step >= s.id ? "bg-charcoal" : "bg-sand"}`} />
        ))}
      </div>
    </div>
  );
}
