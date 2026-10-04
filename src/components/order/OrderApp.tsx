"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Leaf, Plus, Search, ShoppingBag, X } from "lucide-react";
import { DietaryBadges } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getCollectionDays, type SlotConfig, type SlotDay } from "@/lib/hours";
import { hasPriceRange, requiredChoiceHint, startingPrice } from "@/lib/menu-utils";
import { SITE } from "@/lib/site";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { BasketPanel, type CheckoutDetails, type Slot } from "./BasketPanel";
import { ItemDialog } from "./ItemDialog";
import { lineKey, reconcileBasket, type BasketLine, type BasketOption } from "./basket";

const BASKET_KEY = "tc_basket_v1";
const DETAILS_KEY = "tc_customer_v1";
const EMPTY_DETAILS: CheckoutDetails = { name: "", phone: "", email: "", instructions: "", company: "" };

type Props = {
  categories: MenuCategory[];
  initialDays: SlotDay[];
  slotConfig: SlotConfig;
  orderingEnabled: boolean;
  pausedMessage: string | null;
  initialItemId: number | null;
};

function ItemCard({ item, quantity, onAdd }: { item: MenuItem; quantity: number; onAdd: () => void }) {
  const hint = item.available ? requiredChoiceHint(item) : "Currently unavailable";
  return (
    <article
      className={`flex flex-col rounded-2xl bg-white p-4 ring-1 transition ${
        quantity > 0 ? "shadow-md ring-gold/60" : "ring-teak/10 hover:shadow-md hover:ring-gold/40"
      } ${item.available ? "" : "opacity-60"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl leading-tight font-semibold text-charcoal">{item.name}</h3>
        <p className="shrink-0 font-semibold text-teak">
          {hasPriceRange(item) ? <span className="mr-1 text-xs font-normal text-charcoal/50">from</span> : null}
          {formatPrice(startingPrice(item))}
        </p>
      </div>
      <DietaryBadges tags={item.dietary} className="mt-2" />
      {item.description ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-charcoal/65">{item.description}</p> : null}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <p className="text-xs text-charcoal/55">
          {hint}
          {quantity > 0 ? <span className="font-semibold text-gold-deep">{hint ? " · " : ""}{quantity} in basket</span> : null}
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={!item.available}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-charcoal px-4 py-2.5 text-sm font-semibold text-cream transition hover:bg-teak disabled:cursor-not-allowed disabled:bg-charcoal/30"
          aria-label={`Add ${item.name} to basket`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
    </article>
  );
}

export function OrderApp({ categories, initialDays, slotConfig, orderingEnabled, pausedMessage, initialItemId }: Props) {
  const router = useRouter();
  const itemsById = useMemo(() => {
    const map = new Map<number, MenuItem>();
    for (const c of categories) for (const i of c.items) map.set(i.id, i);
    return map;
  }, [categories]);

  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [veggieOnly, setVeggieOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [dialogItem, setDialogItem] = useState<MenuItem | null>(() => {
    const item = initialItemId ? itemsById.get(initialItemId) : undefined;
    return item && item.available ? item : null;
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [days, setDays] = useState<SlotDay[]>(initialDays);
  const [slot, setSlot] = useState<Slot>(() => ({ date: initialDays[0]?.date ?? "", time: initialDays[0]?.times[0] ?? "" }));
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY_DETAILS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore basket + returning-customer details.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BASKET_KEY);
      if (raw) setBasket(reconcileBasket(JSON.parse(raw), itemsById));
      const saved = localStorage.getItem(DETAILS_KEY);
      if (saved) {
        const d = JSON.parse(saved) as Partial<CheckoutDetails>;
        setDetails((prev) => ({ ...prev, name: d.name ?? "", phone: d.phone ?? "", email: d.email ?? "" }));
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [itemsById]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    } catch {
      /* storage unavailable */
    }
  }, [basket, hydrated]);

  // Keep collection slots fresh while the page is open.
  useEffect(() => {
    const update = () => setDays(getCollectionDays(slotConfig));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [slotConfig]);

  useEffect(() => {
    setSlot((prev) => {
      const day = days.find((d) => d.date === prev.date) ?? days[0];
      if (!day) return prev.date || prev.time ? { date: "", time: "" } : prev;
      const time = day.times.includes(prev.time) ? prev.time : day.times[0];
      return prev.date === day.date && prev.time === time ? prev : { date: day.date, time };
    });
  }, [days]);

  useEffect(() => {
    if (!sheetOpen && !dialogItem) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen, dialogItem]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  const addToBasket = useCallback(
    (item: MenuItem, options: BasketOption[], quantity: number) => {
      const key = lineKey(item.id, options.map((o) => o.choiceId));
      const unitPricePence = item.pricePence + options.reduce((sum, o) => sum + o.pricePence, 0);
      setBasket((prev) => {
        if (prev.some((l) => l.key === key)) {
          return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l));
        }
        return [...prev, { key, itemId: item.id, name: item.name, unitPricePence, quantity, options }];
      });
      setError(null);
      showToast(`${quantity > 1 ? `${quantity} × ` : ""}${item.name} added to your basket`);
    },
    [showToast],
  );

  const closeDialog = useCallback(() => setDialogItem(null), []);

  const handleAdd = (item: MenuItem) => {
    if (!item.available) return;
    if (item.groups.length === 0) addToBasket(item, [], 1);
    else setDialogItem(item);
  };

  const setQuantity = (key: string, quantity: number) =>
    setBasket((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, quantity) } : l)),
    );
  const removeLine = (key: string) => setBasket((prev) => prev.filter((l) => l.key !== key));

  const subtotal = basket.reduce((sum, l) => sum + l.unitPricePence * l.quantity, 0);
  const count = basket.reduce((sum, l) => sum + l.quantity, 0);
  const quantityByItem = useMemo(() => {
    const map = new Map<number, number>();
    for (const l of basket) map.set(l.itemId, (map.get(l.itemId) ?? 0) + l.quantity);
    return map;
  }, [basket]);

  const q = query.trim().toLowerCase();
  const visibleCategories = categories
    .filter((c) => activeCategory === "all" || c.id === activeCategory)
    .map((c) => ({
      ...c,
      items: c.items.filter(
        (i) =>
          (!veggieOnly || i.dietary.some((d) => d === "vegetarian" || d === "vegan" || d === "veg_option")) &&
          (!q || i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)),
      ),
    }))
    .filter((c) => c.items.length > 0);

  async function submitOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!basket.length) {
      setError("Your basket is empty — add a dish to get started.");
      return;
    }
    if (!slot.date || !slot.time) {
      setError("Please choose a collection time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: basket.map((l) => ({ itemId: l.itemId, quantity: l.quantity, choiceIds: l.options.map((o) => o.choiceId) })),
          collectionDate: slot.date,
          collectionTime: slot.time,
          name: details.name,
          phone: details.phone,
          email: details.email,
          instructions: details.instructions,
          company: details.company,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { publicId?: string; error?: string };
      if (!res.ok || !data.publicId) {
        throw new Error(data.error || "Sorry, we couldn't place your order. Please try again or call us.");
      }
      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ name: details.name, phone: details.phone, email: details.email }));
        localStorage.removeItem(BASKET_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/order/confirmation/${data.publicId}`);
      setBasket([]);
    } catch (err) {
      setDays(getCollectionDays(slotConfig));
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const panelProps = {
    basket,
    subtotal,
    count,
    onQuantity: setQuantity,
    onRemove: removeLine,
    days,
    slot,
    onSlot: setSlot,
    details,
    onDetails: (patch: Partial<CheckoutDetails>) => setDetails((d) => ({ ...d, ...patch })),
    orderingEnabled,
    pausedMessage,
    submitting,
    error,
    onSubmit: submitOrder,
  };

  return (
    <div className="container-x grid gap-8 pt-2 pb-32 lg:grid-cols-[minmax(0,1fr)_380px] lg:pb-16 xl:grid-cols-[minmax(0,1fr)_410px]">
      <div className="min-w-0">
        <div className="sticky top-16 z-20 -mx-4 border-b border-sand bg-cream/95 px-4 pt-3 pb-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-20 lg:mx-0 lg:px-0">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-charcoal/40" aria-hidden="true" />
            <label htmlFor="menu-search" className="sr-only">
              Search the menu
            </label>
            <input
              id="menu-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, e.g. Pad Thai"
              className="block w-full rounded-full border border-sand bg-white py-2.5 pr-4 pl-10 text-base shadow-sm placeholder:text-charcoal/40 focus:border-gold focus:ring-2 focus:ring-gold/30 focus:outline-none"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              aria-pressed={activeCategory === "all"}
              className={`chip ${activeCategory === "all" ? "chip-active" : ""}`}
            >
              All dishes
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                aria-pressed={activeCategory === c.id}
                className={`chip ${activeCategory === c.id ? "chip-active" : ""}`}
              >
                {c.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setVeggieOnly((v) => !v)}
              aria-pressed={veggieOnly}
              className={`chip ${veggieOnly ? "chip-active" : ""}`}
            >
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              Vegetarian options
            </button>
          </div>
        </div>

        {!orderingEnabled ? (
          <div role="alert" className="mt-6 rounded-2xl border border-chili/30 bg-chili/5 p-4 text-sm text-chili">
            <strong className="font-semibold">Online ordering is paused.</strong>{" "}
            {pausedMessage || `Please call us on ${SITE.phoneDisplay} to place an order.`}
          </div>
        ) : null}

        {visibleCategories.length === 0 ? (
          <div className="py-20 text-center text-charcoal/65">
            <p>No dishes match your search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
                setVeggieOnly(false);
              }}
              className="mt-3 font-semibold text-teak underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          visibleCategories.map((category) => (
            <section key={category.id} aria-labelledby={`order-cat-${category.id}`} className="mt-8">
              <div className="mb-4 border-b border-sand pb-3">
                <h2 id={`order-cat-${category.id}`} className="font-serif text-3xl font-semibold">
                  {category.name}
                </h2>
                {category.description ? <p className="mt-1 text-sm text-charcoal/65">{category.description}</p> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.items.map((item) => (
                  <ItemCard key={item.id} item={item} quantity={quantityByItem.get(item.id) ?? 0} onAdd={() => handleAdd(item)} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <aside className="hidden lg:block" aria-label="Your basket">
        <div className="sticky top-24 mt-4 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-3xl bg-white shadow-xl ring-1 shadow-teak/5 ring-teak/10">
          <BasketPanel {...panelProps} idPrefix="desktop" showTitle />
        </div>
      </aside>

      {/* Mobile basket bar */}
      {hydrated && !sheetOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-charcoal px-5 py-4 text-cream shadow-2xl ring-1 ring-gold/30"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="relative">
                <ShoppingBag className="h-6 w-6 text-gold-light" aria-hidden="true" />
                {count > 0 ? (
                  <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-charcoal">
                    {count}
                  </span>
                ) : null}
              </span>
              {count > 0 ? "View basket & checkout" : "Your basket is empty"}
            </span>
            <span className="font-semibold text-gold-light">{formatPrice(subtotal)}</span>
          </button>
        </div>
      ) : null}

      {/* Mobile slide-up basket */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-charcoal/60" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="basket-sheet-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[94svh] animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <h2 id="basket-sheet-title" className="font-serif text-2xl font-semibold">
                Your collection order
              </h2>
              <button
                type="button"
                autoFocus
                onClick={() => setSheetOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-cream-dark"
                aria-label="Close basket"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain">
              <BasketPanel {...panelProps} idPrefix="mobile" />
            </div>
          </div>
        </div>
      ) : null}

      {dialogItem ? (
        <ItemDialog
          key={dialogItem.id}
          item={dialogItem}
          onClose={closeDialog}
          onAdd={(options, quantity) => {
            addToBasket(dialogItem, options, quantity);
            setDialogItem(null);
          }}
        />
      ) : null}

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8">
        {toast ? (
          <p className="flex animate-rise items-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-medium text-cream shadow-xl ring-1 ring-gold/30">
            <Check className="h-4 w-4 text-gold-light" aria-hidden="true" />
            {toast}
          </p>
        ) : null}
      </div>
    </div>
  );
}
