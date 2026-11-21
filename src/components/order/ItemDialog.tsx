"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import { AllergenBadges, DietaryBadges } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { MenuGroup, MenuItem } from "@/lib/types";
import type { BasketOption } from "./basket";

type Props = {
  item: MenuItem;
  onClose: () => void;
  onAdd: (options: BasketOption[], quantity: number) => void;
};

function initialSelection(item: MenuItem) {
  const selection: Record<number, number[]> = {};
  for (const group of item.groups) {
    const available = group.choices.filter((c) => c.available);
    // Pre-select free single-choice groups (e.g. "Mild" spice) to keep ordering fast.
    if (group.required && Math.max(1, group.maxSelect) === 1 && available.length > 0 && available.every((c) => c.pricePence === 0)) {
      selection[group.id] = [available[0].id];
    }
  }
  return selection;
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex]:not([tabindex="-1"])';

export function ItemDialog({ item, onClose, onAdd }: Props) {
  const [selected, setSelected] = useState<Record<number, number[]>>(() => initialSelection(item));
  const [quantity, setQuantity] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  const trapFocus = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const nodes = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const missing = item.groups.filter((g) => g.required && !(selected[g.id]?.length ?? 0));
  const unitPrice =
    item.pricePence +
    item.groups.reduce(
      (sum, g) => sum + (selected[g.id] ?? []).reduce((acc, id) => acc + (g.choices.find((c) => c.id === id)?.pricePence ?? 0), 0),
      0,
    );

  function toggle(group: MenuGroup, choiceId: number) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      const max = Math.max(1, group.maxSelect);
      if (max === 1) {
        if (!group.required && current[0] === choiceId) return { ...prev, [group.id]: [] };
        return { ...prev, [group.id]: [choiceId] };
      }
      if (current.includes(choiceId)) return { ...prev, [group.id]: current.filter((id) => id !== choiceId) };
      if (current.length >= max) return prev;
      return { ...prev, [group.id]: [...current, choiceId] };
    });
  }

  function add() {
    if (missing.length) {
      setShowErrors(true);
      document.getElementById(`option-group-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const options: BasketOption[] = item.groups.flatMap((g) =>
      (selected[g.id] ?? []).flatMap((id) => {
        const choice = g.choices.find((c) => c.id === id);
        return choice ? [{ groupId: g.id, group: g.name, choiceId: choice.id, choice: choice.name, pricePence: choice.pricePence }] : [];
      }),
    );
    onAdd(options, quantity);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onKeyDown={trapFocus}>
      <div className="absolute inset-0 animate-fade-in bg-charcoal/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-dialog-title"
        className="relative flex max-h-[92svh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-cream shadow-2xl sm:max-w-lg sm:animate-rise sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sand bg-white px-5 py-4">
          <div>
            <h2 id="item-dialog-title" className="font-serif text-2xl leading-tight font-semibold">
              {item.name}
            </h2>
            <p className="mt-0.5 font-semibold text-teak">{formatPrice(item.pricePence)}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream-dark transition hover:bg-sand"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
          {item.description ? <p className="text-sm leading-relaxed text-charcoal/75">{item.description}</p> : null}
          <DietaryBadges tags={item.dietary} />
          <AllergenBadges allergens={item.allergens} />
          {item.groups.map((group) => {
            const max = Math.max(1, group.maxSelect);
            const useRadio = max === 1 && group.required;
            const picked = selected[group.id] ?? [];
            const isMissing = showErrors && group.required && picked.length === 0;
            return (
              <div
                key={group.id}
                id={`option-group-${group.id}`}
                className={`rounded-2xl border bg-white p-4 transition ${isMissing ? "border-chili/60 ring-2 ring-chili/15" : "border-sand"}`}
              >
                <fieldset>
                  <legend className="w-full">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-charcoal">{group.name}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          group.required ? "bg-charcoal text-cream" : "bg-cream-dark text-charcoal/70"
                        }`}
                      >
                        {group.required ? "Required" : max > 1 ? `Optional · up to ${max}` : "Optional"}
                      </span>
                    </span>
                  </legend>
                  {isMissing ? (
                    <p className="mt-1 text-sm font-medium text-chili" role="alert">
                      Please choose an option
                    </p>
                  ) : null}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.choices.map((choice) => {
                      const checked = picked.includes(choice.id);
                      return (
                        <label
                          key={choice.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                            checked ? "border-charcoal bg-charcoal text-cream" : "border-sand bg-white hover:border-gold"
                          } ${choice.available ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                        >
                          <input
                            type={useRadio ? "radio" : "checkbox"}
                            name={`group-${group.id}`}
                            value={choice.id}
                            checked={checked}
                            disabled={!choice.available}
                            onChange={() => toggle(group, choice.id)}
                            className="h-4 w-4 accent-gold"
                          />
                          <span className="flex-1 font-medium">
                            {choice.name}
                            {!choice.available ? " (unavailable)" : ""}
                          </span>
                          {choice.pricePence > 0 ? (
                            <span className={checked ? "text-gold-light" : "text-charcoal/60"}>+{formatPrice(choice.pricePence)}</span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-sand bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center rounded-full border border-sand">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-cream-dark disabled:opacity-40"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-7 text-center font-semibold" aria-live="polite">
              <span className="sr-only">Quantity </span>
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-cream-dark"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button type="button" onClick={add} className="btn btn-gold flex-1 px-4 py-3.5 text-base">
            Add · {formatPrice(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
