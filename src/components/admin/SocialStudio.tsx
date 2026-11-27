"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Copy, ExternalLink, Loader2, MessageCircle, Share2, Sparkles, Upload, Wand2 } from "lucide-react";
import { SITE } from "@/lib/site";

// Minimal dish shape passed from server
export type SocialDish = {
  id: number;
  name: string;
  description: string | null;
  pricePence: number;
  categoryName: string;
};

export type SocialOffer = {
  id: number;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  status: string;
};

type TemplateId = "dish" | "collection" | "weekend" | "review" | "hours" | "offer";

type Cta = "order" | "book" | "both" | "review";

const TEMPLATES: { id: TemplateId; label: string; desc: string; needsDish: boolean }[] = [
  { id: "dish", label: "Dish spotlight", desc: "Showcase one dish — great for Pad Thai, Massaman, etc.", needsDish: true },
  { id: "collection", label: "Order for collection", desc: "Tonight’s collection push — ready in ~20 mins", needsDish: false },
  { id: "weekend", label: "Weekend in Molesey", desc: "Weekend family & friends — East Molesey / Hampton Court", needsDish: false },
  { id: "review", label: "Word of mouth", desc: "Ask for Google review / WhatsApp share", needsDish: false },
  { id: "hours", label: "We’re open", desc: "Tue–Sat 12–21 reminder", needsDish: false },
  { id: "offer", label: "Offer / Special", desc: "Use an active Offer or a custom line", needsDish: false },
];

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function dishHashtag(name: string) {
  return "#" + name.replace(/[^a-zA-Z0-9]/g, "");
}

function coreHashtags(dish?: SocialDish) {
  const base = [
    "#ThaiCourtyard",
    "#ThaiCourtyardEastMolesey",
    "#EastMolesey",
    "#HamptonCourt",
    "#ThamesDitton",
    "#SurreyEats",
    "#ThaiFood",
    "#SupportLocal",
  ];
  if (dish) {
    const d = dishHashtag(dish.name);
    if (!base.includes(d) && d.length > 2 && d.length < 20) base.splice(2, 0, d);
  }
  return base;
}

function orderLink(platform: "instagram" | "facebook") {
  if (platform === "facebook") return `${SITE.url}/order`;
  return `thaicourtyardmolesey.co.uk/order  (link in bio)`;
}

function bookLink(platform: "instagram" | "facebook") {
  if (platform === "facebook") return `${SITE.url}/book`;
  return `thaicourtyardmolesey.co.uk/book  (link in bio)`;
}

function addressLine() {
  return `${SITE.addressLine} · ${SITE.phoneDisplay}`;
}

type GenInput = {
  template: TemplateId;
  dish: SocialDish | null;
  offer: SocialOffer | null;
  customLine: string;
  cta: Cta;
  withEmoji: boolean;
  withHashtags: boolean;
};

function buildCopy(input: GenInput, platform: "instagram" | "facebook", variant: 1 | 2 | 3): string {
  const { template, dish, offer, customLine, cta, withEmoji, withHashtags } = input;
  const linkOrder = orderLink(platform);
  const linkBook = bookLink(platform);
  const emoji = withEmoji;
  const hashtags = withHashtags ? `\n\n${coreHashtags(dish ?? undefined).join(" ")}` : "";

  const custom = customLine.trim() ? `\n\n${customLine.trim()}` : "";

  let ctaLine = "";
  if (cta === "order") ctaLine = `${emoji ? "🥢 " : ""}Order for collection → ${linkOrder}`;
  if (cta === "book") ctaLine = `${emoji ? "📅 " : ""}Reserve your table → ${linkBook}`;
  if (cta === "both") ctaLine = `${emoji ? "🥢 " : ""}Order for collection → ${linkOrder}\n${emoji ? "📅 " : ""}Book a table → ${linkBook}`;
  if (cta === "review") ctaLine = `${emoji ? "⭐ " : ""}Enjoyed us? Leave a Google review → ${SITE.googleReviewUrl}`;

  const dishName = dish?.name ?? "Chef’s Special";
  const dishDescRaw = dish?.description ? dish.description : "slow-cooked with fragrant herbs, toasted spices and our family recipe";
  const dishDesc = dishDescRaw.length > 120 ? dishDescRaw.slice(0, 117) + "…" : dishDescRaw;
  const dishPrice = dish ? ` · ${formatPrice(dish.pricePence)}` : "";
  const cat = dish?.categoryName ?? "house favourite";

  const v = variant - 1;

  // Premium, story-led intros
  const intro = {
    dish: [
      `${emoji ? "🇹🇭✨ " : ""}The first bite says a lot.`,
      `${emoji ? "🍜 " : ""}The one regulars order before they’ve sat down —`,
      `${emoji ? "🔥 " : ""}Wok-kissed in East Molesey —`,
    ],
    collection: [
      `${emoji ? "Tonight, let us do the cooking " : "Tonight, let us do the cooking "}—`,
      `${emoji ? "No washing up. Just wok heat. " : "No washing up. Just wok heat. "}`,
      `${emoji ? "Your Thai, ready when you are " : "Your Thai, ready when you are "}—`,
    ],
    weekend: [
      `${emoji ? "🌿 " : ""}Weekend plans around Hampton Court?`,
      `${emoji ? "✨ " : ""}Molesey at the weekend — done right.`,
      `${emoji ? "👨‍👩‍👧‍👦 " : ""}A table for two, a takeaway for four —`,
    ],
    review: [
      `${emoji ? "💛 " : ""}Small restaurant, big word of mouth.`,
      `${emoji ? "🙏 " : ""}If we made your evening —`,
      `${emoji ? "⭐ " : ""}Family-run, community-powered.`,
    ],
    hours: [
      `${emoji ? "🔥 " : ""}Woks on. Door open.`,
      `${emoji ? "📍 " : ""}Find us on Walton Road —`,
      `${emoji ? "🕛 " : ""}Your local Thai, this week:`,
    ],
    offer: [
      `${emoji ? "🎉 " : ""}${offer?.title ?? "A little thank-you from our kitchen"}`,
      `${emoji ? "✨ " : ""}${offer?.title ?? "This week’s little extra"}`,
      `${emoji ? "💫 " : ""}${offer?.title ?? "Not to be missed on Walton Road"}`,
    ],
  } as const;

  if (template === "dish" && dish) {
    const bodies = [
      `${intro.dish[v]}\n\n${dishName}${dishPrice}\n${dishDesc}. Our ${cat.toLowerCase()} — balanced, fragrant and cooked to order in our East Molesey kitchen. A perfect start (or the main event).\n\n${ctaLine}\n${emoji ? "📍 " : ""}Thai Courtyard · ${addressLine()} · ${SITE.hoursSummary}${custom}`,
      `${intro.dish[v]} ${dishName}${dishPrice}.\n\n${dishDesc.charAt(0).toUpperCase() + dishDesc.slice(1)}${dishDesc.endsWith(".") ? "" : "."} Finished with fresh herbs, served exactly how our chefs eat it — generous, aromatic and made to be shared.\n\n${ctaLine}\n${emoji ? "📞 " : ""}${SITE.phoneDisplay} · Collection in ~20 mins, pay on collection (cash/card)${custom}`,
      `${dishName} — ${emoji ? "the quiet star of our " + cat.toLowerCase() + " menu " : "the quiet star of our " + cat.toLowerCase() + " menu "}${dishPrice}\n\n${dishDesc} — wok-tossed to order, never pre-made. Regulars have it on repeat, newcomers get it once and understand why.\n\n${ctaLine}\n${emoji ? "📍 " : ""}105 Walton Road, East Molesey KT8 0DR — 5 mins from Hampton Court${custom}`,
    ];
    return bodies[v] + hashtags;
  }

  if (template === "collection") {
    const bodies = [
      `${intro.collection[v]} fresh Thai, cooked to order on Walton Road.\n\nPick your dishes, pick your time — curries, stir-fries, Pad Thai, noodles & chef’s specials. Ready in ~20 mins, handed to you at the door. Pay on collection, cash or card.${custom}\n\n${ctaLine}\n${emoji ? "📍 " : ""}${addressLine()} · ${SITE.hoursSummary}`,
      `${intro.collection[v]} skip the shop, skip the wait.\n\nYour local Thai in Molesey — fragrant, generous and made fresh, not reheated. From Massaman to Pad Kra Pao, we cook when you order.${custom}\n\n${ctaLine}\n${emoji ? "💳 " : ""}Pay on collection · Collection slots every 15 mins`,
      `${intro.collection[v]} wok heat, then straight to your box.\n\nCollection tonight from Thai Courtyard — 105 Walton Road, KT8. Near Hampton Court Palace, Thames Ditton & Esher. Choose your time and we’ll have it ready, steaming.\n\n${ctaLine}\n${emoji ? "🕛 " : ""}${SITE.hoursSummary} · ${custom ? "" : "Free on-street parking when you collect."}${custom}`,
    ];
    return bodies[v] + hashtags;
  }

  if (template === "weekend") {
    const bodies = [
      `${intro.weekend[v]}\n\nLet us host. Thai Courtyard is cosy, family-run and 5 minutes from Hampton Court Palace — dine in on Walton Road or order for collection if you’re staying in. BYOB-friendly, flavour-packed, cooked to order.${custom}\n\n${ctaLine}\n${emoji ? "📍 " : ""}${addressLine()} · ${SITE.hoursSummary}`,
      `${intro.weekend[v]}\n\nFrom slow-cooked Massaman to fiery Tom Yum, silk noodles to crisp starters — bring the people you love, we’ll bring the fragrance. Book a table or pre-order for collection.${custom}\n\n${ctaLine}\n${emoji ? "🚗 " : ""}Thames Ditton · Hampton · Esher · Teddington — all a few minutes away`,
      `${intro.weekend[v]} we’ve saved your seat — or your takeaway slot.\n\nBushy Park walk then Thai? Hampton Court day then a feast? We’re open ${SITE.hoursSummary.toLowerCase()} for dine-in and collection, pay on collection.${custom}\n\n${ctaLine}`,
    ];
    return bodies[v] + hashtags;
  }

  if (template === "review") {
    const bodies = [
      `${intro.review[v]}\n\nIf you’ve collected or dined with us in East Molesey or Hampton Court, a quick Google review goes further than any advert. It helps neighbours find a local, family-run kitchen that cooks everything to order — and it keeps us going while business is quieter.${custom}\n\n${ctaLine}\n${emoji ? "💛 " : ""}Thank you — every word and share truly counts. — The Thai Courtyard family`,
      `${intro.review[v]} a minute of your time makes a real difference.\n\nShare us with a friend in Thames Ditton, Hampton, Esher or Teddington, or tap to leave stars on Google. Your words help our small team stay visible to the community we love to feed.${custom}\n\n${ctaLine}\n${emoji ? "📣 " : ""}Share with a friend → ${SITE.url}`,
      `Loved your night? ${emoji ? "Tell Molesey. " : "Tell Molesey. "}\n\n${intro.review[v]} Your review on Google keeps authentic Thai in KT8 discoverable — and tells our chefs their wok work mattered.${custom}\n\n${ctaLine}\n${emoji ? "⭐ " : ""}We read every single one.`,
    ];
    return bodies[v] + hashtags;
  }

  if (template === "hours") {
    const bodies = [
      `${intro.hours[v]}\n\nWe’re open ${SITE.hoursSummary} on Walton Road — dine in or take away. Fresh Thai, cooked when you order, not before.\n\n${ctaLine}\n${emoji ? "📍 " : ""}${SITE.addressLine} · ${SITE.phoneDisplay}${custom}`,
      `${intro.hours[v]} Tuesday to Saturday, 12:00–21:00.\n\nFrom jasmine rice to jasmine nights — pop in, book ahead, or pre-order for collection. Pay on collection, cash or card.${custom}\n\n${ctaLine}`,
      `${intro.hours[v]}\n\n${SITE.hoursSummary.toLowerCase()} · 105 Walton Road, KT8 0DR — 5 mins from Hampton Court Station. Your local, family-run Thai, firing the woks daily.${custom}\n\n${ctaLine}\n${emoji ? "📞 " : ""}${SITE.phoneDisplay} for last-minute tables & collections`,
    ];
    return bodies[v] + hashtags;
  }

  if (template === "offer") {
    const title = offer?.title ?? "A little extra from us";
    const desc = offer?.description ?? (customLine ? "" : "Fresh specials, generous portions — something new to try, same family kitchen, same wok heat.");
    const offerCta = offer ? `${offer.ctaText} → ${offer.ctaLink}` : ctaLine;
    const bodies = [
      `${intro.offer[v]}\n\n${title}${desc ? ` — ${desc}` : ""}${custom}\n\n${offer ? offerCta : ctaLine}\n${emoji ? "📍 " : ""}${addressLine()} · ${SITE.hoursSummary}`,
      `${title} — on now at Thai Courtyard ${emoji ? "✨" : ""}\n\n${desc}${custom}\n\n${offer ? offerCta : ctaLine}\n${emoji ? "⏳ " : ""}While it lasts — collection & dine-in.`,
      `${intro.offer[v]}: ${title}\n${desc}${custom}\n\n${offer ? offerCta : ctaLine}\n${emoji ? "💛 " : ""}Family-run in Molesey — thank you for supporting local.`,
    ];
    return bodies[v] + hashtags;
  }

  return `${intro.collection[v]}${custom}\n\n${ctaLine}${hashtags}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
    }
  }
  return (
    <button type="button" onClick={copy} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${copied ? "bg-emerald-600 text-white" : "bg-charcoal text-cream hover:bg-teak-dark"}`}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function SocialStudio({ dishes, offers }: { dishes: SocialDish[]; offers: SocialOffer[] }) {
  const [template, setTemplate] = useState<TemplateId>("dish");
  const [dishId, setDishId] = useState<number | null>(() => dishes[0]?.id ?? null);
  const [offerId, setOfferId] = useState<number | null>(() => offers[0]?.id ?? null);
  const [customLine, setCustomLine] = useState("");
  const [cta, setCta] = useState<Cta>("order");
  const [withEmoji, setWithEmoji] = useState(true);
  const [withHashtags, setWithHashtags] = useState(true);
  const [publishImage, setPublishImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);
  const [publishMsg, setPublishMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const dish = useMemo(() => dishes.find((d) => d.id === dishId) ?? null, [dishes, dishId]);
  const offer = useMemo(() => offers.find((o) => o.id === offerId) ?? null, [offers, offerId]);

  // Keep dish valid when template changes
  useEffect(() => {
    if (template === "dish" && !dish && dishes[0]) setDishId(dishes[0].id);
    if (template === "offer" && !offer && offers[0]) setOfferId(offers[0].id);
  }, [template, dish, dishes, offer, offers]);

  const input: GenInput = useMemo(
    () => ({ template, dish: template === "dish" ? dish : null, offer: template === "offer" ? offer : null, customLine, cta, withEmoji, withHashtags }),
    [template, dish, offer, customLine, cta, withEmoji, withHashtags]
  );

  const insta = useMemo(() => [1, 2, 3].map((n) => buildCopy(input, "instagram", n as 1 | 2 | 3)), [input]);
  const facebook = useMemo(() => [1, 2, 3].map((n) => buildCopy(input, "facebook", n as 1 | 2 | 3)), [input]);

  function onPublishImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setPublishMsg({ type: "error", text: "Image too large — use under 4 MB (PNG/JPEG/WebP)." });
      e.target.value = "";
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setPublishMsg({ type: "error", text: "Use PNG, JPEG or WebP." });
      e.target.value = "";
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setPublishImage(typeof r.result === "string" ? r.result : null);
      setPublishMsg(null);
    };
    r.readAsDataURL(file);
  }

  async function publish(caption: string, idx: number) {
    setPublishing(idx);
    setPublishMsg(null);
    try {
      const res = await fetch("/api/admin/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, imageData: publishImage }),
      });
      const data = await res.json().catch(() => ({})) as { ok?: boolean; id?: string; error?: string; note?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not publish.");
      setPublishMsg({ type: "ok", text: data.note ? `Posted to Facebook #${data.id}. ${data.note}` : `Posted to Facebook ✓ #${data.id} — if Auto-share to Instagram is on, it will appear on Instagram too.` });
    } catch (e) {
      setPublishMsg({ type: "error", text: e instanceof Error ? e.message : "Publish failed." });
    } finally {
      setPublishing(null);
    }
  }

  const dishesByCategory = useMemo(() => {
    const map = new Map<string, SocialDish[]>();
    for (const d of dishes) {
      const list = map.get(d.categoryName) ?? [];
      list.push(d);
      map.set(d.categoryName, list);
    }
    return Array.from(map.entries());
  }, [dishes]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <div className="space-y-4">
          <div className="adm-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Wand2 className="h-4 w-4 text-gold-deep" /> Generator
            </h2>
            <p className="mt-1 text-xs leading-5 text-black/60">Templates + your live menu. Text-only, ready to paste into <strong className="font-semibold text-charcoal">Facebook</strong> — auto-shares to Instagram when your Page is linked.</p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="adm-label">Post type</label>
                <div className="mt-1.5 grid gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${template === t.id ? "border-gold bg-gold/10" : "border-black/10 bg-white hover:border-black/15"}`}
                    >
                      <p className={`text-sm font-semibold ${template === t.id ? "text-gold-deep" : "text-charcoal"}`}>{t.label}</p>
                      <p className="text-xs leading-4 text-black/55">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {template === "dish" ? (
                <div>
                  <label className="adm-label">Dish to spotlight</label>
                  <select className="adm-input mt-1" value={dishId ?? ""} onChange={(e) => setDishId(Number(e.target.value))}>
                    {dishesByCategory.map(([cat, list]) => (
                      <optgroup key={cat} label={cat}>
                        {list.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} — {formatPrice(d.pricePence)} {d.description ? `· ${d.description.slice(0, 40)}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {dish ? (
                    <p className="mt-1.5 text-xs leading-5 text-black/55">
                      {dish.categoryName} · {formatPrice(dish.pricePence)}
                      {dish.description ? ` — ${dish.description}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-amber-700">No dishes found. Add dishes in Menu & prices.</p>
                  )}
                </div>
              ) : null}

              {template === "offer" ? (
                <div>
                  <label className="adm-label">Active offer</label>
                  {offers.length === 0 ? (
                    <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 ring-1 ring-amber-200">
                      No active offers. Create one in Marketing → Offers, or use Custom line below.
                    </p>
                  ) : (
                    <select className="adm-input mt-1" value={offerId ?? ""} onChange={(e) => setOfferId(Number(e.target.value))}>
                      {offers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title} — {o.status} · {o.ctaText}
                        </option>
                      ))}
                    </select>
                  )}
                  {offer ? <p className="mt-1.5 text-xs leading-5 text-black/55">{offer.description || "No description"}</p> : null}
                </div>
              ) : null}

              <div>
                <label className="adm-label">
                  Custom line <span className="font-normal text-black/45">(optional)</span>
                </label>
                <textarea
                  className="adm-input mt-1 min-h-20"
                  placeholder={
                    template === "dish"
                      ? "e.g. Vegan-friendly · add extra chilli if you like it hot"
                      : template === "review"
                        ? "e.g. Mention code THANKYOU for a little extra on next collection"
                        : "e.g. Free prawn crackers with orders over £40 this week"
                  }
                  maxLength={220}
                  value={customLine}
                  onChange={(e) => setCustomLine(e.target.value)}
                />
                <p className="mt-1 text-right text-[11px] text-black/40">{customLine.length}/220</p>
              </div>

              <div>
                <label className="adm-label">Call to action</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["order", "Order collection"],
                      ["book", "Book a table"],
                      ["both", "Order + Book"],
                      ["review", "Google review"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCta(value)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${cta === value ? "bg-charcoal text-cream" : "bg-black/5 text-charcoal hover:bg-black/10"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={withEmoji} onChange={(e) => setWithEmoji(e.target.checked)} className="h-4 w-4 rounded border-black/20" />{" "}
                  <span>Emoji</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={withHashtags} onChange={(e) => setWithHashtags(e.target.checked)} className="h-4 w-4 rounded border-black/20" />{" "}
                  <span>Hashtags</span>
                </label>
              </div>

              <div className="adm-card overflow-hidden border-dashed bg-white">
                <div className="p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4 text-gold-deep" /> Post image <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Required for Instagram</span></p>
                  <p className="mt-1 text-xs leading-5 text-black/55">Upload a dish or dining-room photo — it appears in the previews on the right and will publish as a Facebook photo (auto-shares to Instagram). 1080×1080 square is perfect for IG, 4:3 also works for Facebook. Max 4 MB.</p>
                  <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-black/10 bg-cream px-4 py-6 text-center transition hover:border-gold/40 hover:bg-gold/5">
                    <Camera className="h-6 w-6 text-black/30" />
                    <span className="text-sm font-medium text-charcoal">Click to upload or drag & drop</span>
                    <span className="text-xs text-black/45">PNG, JPEG or WebP</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPublishImage} className="hidden" />
                  </label>
                  {publishImage ? (
                    <div className="mt-3 flex items-center gap-3">
                      <img src={publishImage} alt="Publish preview" className="h-16 w-24 rounded-lg object-cover ring-1 ring-black/10" />
                      <button type="button" onClick={() => setPublishImage(null)} className="adm-btn">Remove</button>
                      <span className="text-xs text-black/50">{Math.round(publishImage.length / 1024)} KB · will post as Facebook photo</span>
                    </div>
                  ) : null}
                  {publishMsg ? (
                    <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${publishMsg.type === "ok" ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>{publishMsg.text}</p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl bg-cream-dark p-3 text-xs leading-5 text-black/60 ring-1 ring-black/5">
                <p className="font-semibold text-charcoal">Facebook first</p>
                <p className="mt-1">
                  Facebook links are clickable (<span className="font-mono text-[11px]">{SITE.url}/order</span>) and <span className="font-medium">image posts auto-share to Instagram</span> when your Page is linked in Meta Business Suite. Instagram alone shows “link in bio” — paste to Facebook and it covers both.
                </p>
              </div>
            </div>
          </div>

          <div className="adm-card p-4">
            <p className="text-xs font-semibold tracking-wide text-black/50 uppercase">Quick links</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href={SITE.url} target="_blank" rel="noopener noreferrer" className="adm-btn">
                <ExternalLink /> Website
              </a>
              <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="adm-btn">
                <ExternalLink /> Google reviews
              </a>
              <a href={SITE.deliverooUrl} target="_blank" rel="noopener noreferrer" className="adm-btn">
                <ExternalLink /> Deliveroo
              </a>
            </div>
            <p className="mt-2 text-xs leading-5 text-black/50">
              {SITE.hoursSummary} · {SITE.addressLine}
            </p>
          </div>
        </div>

        {/* Previews — Facebook first */}
        <div className="space-y-5">
          {/* Facebook — dominant */}
          <section className="adm-card overflow-hidden ring-2 ring-[#1877F2]/10">
            <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-[#1877F2]/10 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-[#1877F2]" /> Facebook — 3 ready-to-copy captions · clickable link
              </h3>
              <span className="rounded-full bg-[#1877F2] px-2.5 py-1 text-xs font-bold text-white">Primary</span>
            </div>
            <div className="grid gap-4 p-4">
              {facebook.map((text, i) => (
                <div key={i} className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold tracking-wide text-black/50 uppercase">Variant {String.fromCharCode(65 + i)} · {text.length} chars</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => publish(text, 100 + i)} disabled={publishing !== null} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${publishImage ? "bg-[#1877F2] text-white hover:bg-[#166fe5]" : "bg-charcoal text-cream hover:bg-black"} disabled:opacity-50`}>
                        {publishing === 100 + i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {publishImage ? "Publish + IG" : "Publish to Facebook"}
                      </button>
                      <CopyButton text={text} />
                    </div>
                  </div>
                  {publishImage ? (
                    <img src={publishImage} alt="Post preview" className="mt-3 aspect-[4/3] w-full rounded-xl object-cover ring-1 ring-black/10" />
                  ) : (
                    <div className="mt-3 grid h-24 place-items-center rounded-xl bg-cream-dark text-xs text-black/40 ring-1 ring-black/5">No photo — adds as text-only Facebook post (won’t auto-share to IG)</div>
                  )}
                  <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-cream p-3 text-sm leading-6 text-charcoal ring-1 ring-black/5">
                    {text}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* Instagram — secondary, auto-shared from Facebook */}
          <section className="adm-card overflow-hidden opacity-[0.96]">
            <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-gradient-to-r from-fuchsia-50/60 to-amber-50/60 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-black/70">
                <Camera className="h-4 w-4 text-pink-600" /> Instagram — auto-shared from Facebook
              </h3>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-black/60 ring-1 ring-black/10">via Facebook · link in bio</span>
            </div>
            <div className="grid gap-4 p-4">
              {insta.map((text, i) => (
                <div key={i} className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold tracking-wide text-black/50 uppercase">Variant {String.fromCharCode(65 + i)} · {text.length} chars</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => publish(text, i)} disabled={publishing !== null} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${publishImage ? "bg-pink-600 text-white hover:bg-pink-700" : "bg-black/10 text-black/60 hover:bg-black/15"} disabled:opacity-50`} title={publishImage ? "Publishes to Facebook and auto-shares to Instagram" : "Publishes to Facebook (text-only — won’t auto-share to IG without a photo)"}>
                        {publishing === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        Publish
                      </button>
                      <CopyButton text={text} />
                    </div>
                  </div>
                  {publishImage ? (
                    <img src={publishImage} alt="Post preview" className="mt-3 aspect-square w-full rounded-xl object-cover ring-1 ring-black/10" />
                  ) : (
                    <div className="mt-3 grid h-24 place-items-center rounded-xl bg-cream-dark text-xs text-black/40 ring-1 ring-black/5">No photo — add one in “Photo for Publish” to preview</div>
                  )}
                  <pre className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-cream p-3 text-sm leading-6 text-charcoal ring-1 ring-black/5">
                    {text}
                  </pre>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://www.instagram.com/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-btn inline-flex"
                    >
                      <ExternalLink /> Open Instagram
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="adm-btn"
                    >
                      <Share2 /> Share via WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 text-xs text-black/45">
            <Sparkles className="h-3.5 w-3.5" /> Facebook is primary — add your photo and hit Publish to Facebook. Instagram gets the image post automatically when your Page’s “Auto-share to Instagram” is on.
          </div>
        </div>
      </div>
    </div>
  );
}
