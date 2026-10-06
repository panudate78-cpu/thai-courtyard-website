"use client";

import { useId, type FormEvent } from "react";
import { Clock, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PaymentNotice } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import type { SlotDay } from "@/lib/hours";
import { SITE } from "@/lib/site";
import type { BasketLine } from "./basket";

export type CheckoutDetails = { name: string; phone: string; email: string; instructions: string; company: string };
export type Slot = { date: string; time: string };

type Props = {
  idPrefix: string;
  showTitle?: boolean;
  basket: BasketLine[];
  subtotal: number;
  count: number;
  onQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
  days: SlotDay[];
  slot: Slot;
  onSlot: (slot: Slot) => void;
  details: CheckoutDetails;
  onDetails: (patch: Partial<CheckoutDetails>) => void;
  orderingEnabled: boolean;
  pausedMessage: string | null;
  submitting: boolean;
  error: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export function BasketPanel(props: Props) {
  const {
    idPrefix,
    showTitle,
    basket,
    subtotal,
    count,
    onQuantity,
    onRemove,
    days,
    slot,
    onSlot,
    details,
    onDetails,
    orderingEnabled,
    pausedMessage,
    submitting,
    error,
    onSubmit,
  } = props;
  const uid = useId();
  const fieldId = (name: string) => `${idPrefix}-${uid}-${name}`;
  const selectedDay = days.find((d) => d.date === slot.date);

  return (
    <div className="p-5 sm:p-6">
      {showTitle ? (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Your collection order</h2>
          {count > 0 ? (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-deep">
              {count} item{count === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      ) : null}

      {basket.length === 0 ? (
        <div className={`rounded-2xl border border-dashed border-sand p-6 text-center ${showTitle ? "mt-4" : ""}`}>
          <ShoppingBag className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
          <p className="mt-2 font-semibold">Your basket is empty</p>
          <p className="mt-1 text-sm text-charcoal/60">Tap “Add” on any dish to start your order.</p>
        </div>
      ) : (
        <>
          <ul className={`divide-y divide-sand ${showTitle ? "mt-3" : ""}`} aria-label="Basket items">
            {basket.map((line) => (
              <li key={line.key} className="flex gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="leading-snug font-semibold">{line.name}</p>
                  {line.options.length ? (
                    <p className="mt-0.5 text-xs text-charcoal/60">{line.options.map((o) => o.choice).join(" · ")}</p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-sand bg-white">
                      <button
                        type="button"
                        onClick={() => onQuantity(line.key, line.quantity - 1)}
                        className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream-dark"
                        aria-label={`Decrease quantity of ${line.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantity(line.key, line.quantity + 1)}
                        className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-cream-dark"
                        aria-label={`Increase quantity of ${line.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(line.key)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-charcoal/55 hover:text-chili"
                      aria-label={`Remove ${line.name} from basket`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-semibold">{formatPrice(line.unitPricePence * line.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex items-center justify-between border-t border-sand pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <fieldset>
          <legend className="mb-2 flex items-center gap-2 text-sm font-semibold text-charcoal/85">
  <Clock className="h-4 w-4 text-gold-deep" aria-hidden="true" />
  Collection Orders
</legend>
          {days.length === 0 ? (
            <p className="rounded-xl bg-cream-dark p-3 text-sm text-charcoal/70">
              No collection times are available right now. We&apos;re open {SITE.hoursSummary} — please call{" "}
              <a href={SITE.phoneHref} className="font-semibold underline">
                {SITE.phoneDisplay}
              </a>
              .
            </p>
          ) : (
            <div className="space-y-2">
              
              <div>
                <label htmlFor={fieldId("time")} className="sr-only">
                  Collection Orders
                </label>
             <div className="rounded-xl border border-black/10 bg-black/5 p-3 text-sm">
  We aim to have collection orders ready within approximately 30 minutes.
  If there is a significant delay we will contact you using the telephone number provided.
</div>

              </div>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor={fieldId("name")} className="label">
            Name <span className="text-chili" aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("name")}
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={details.name}
            onChange={(e) => onDetails({ name: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor={fieldId("phone")} className="label">
            Telephone <span className="text-chili" aria-hidden="true">*</span>
          </label>
          <input
            id={fieldId("phone")}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            maxLength={25}
            value={details.phone}
            onChange={(e) => onDetails({ phone: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor={fieldId("email")} className="label">
          Email Address <span className="text-red-600">*</span>
        </label>

          <p className="mt-1 text-sm text-charcoal/60">
          Required for order confirmation and updates.
          </p>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            value={details.email}
            onChange={(e) => onDetails({ email: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label htmlFor={fieldId("instructions")} className="label">
            Special instructions <span className="font-normal text-charcoal/50">(optional)</span>
          </label>
          <textarea
            id={fieldId("instructions")}
            name="instructions"
            rows={2}
            maxLength={600}
            placeholder="Allergies, extra spicy, no peanuts…"
            value={details.instructions}
            onChange={(e) => onDetails({ instructions: e.target.value })}
            className="input resize-y"
          />
        </div>
        <div className="hidden" aria-hidden="true">
          <label htmlFor={fieldId("company")}>Company</label>
          <input
            id={fieldId("company")}
            tabIndex={-1}
            autoComplete="off"
            value={details.company}
            onChange={(e) => onDetails({ company: e.target.value })}
          />
        </div>

        <PaymentNotice compact />

        {!orderingEnabled ? (
          <p role="alert" className="rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">
            {pausedMessage || `Online ordering is paused at the moment. Please call us on ${SITE.phoneDisplay}.`}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || basket.length === 0 || !orderingEnabled || days.length === 0}
          className="btn btn-gold w-full py-4 text-base"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" /> Placing your order…
            </>
          ) : (
            <>Place collection order{basket.length ? ` · ${formatPrice(subtotal)}` : ""}</>
          )}
        </button>
        <p className="text-center text-xs leading-relaxed text-charcoal/55">
          Collection only from {SITE.addressLine}. Questions? Call{" "}
          <a href={SITE.phoneHref} className="font-semibold underline">
            {SITE.phoneDisplay}
          </a>
          .
        </p>
      </form>
    </div>
  );
}
