"use client";

import { useId, useMemo, useState, type FormEvent } from "react";
import { Clock, CreditCard, Loader2, Minus, Plus, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { PaymentNotice } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { parseHours, type SlotDay } from "@/lib/hours";
import { isRestaurantOpenNow } from "@/lib/opening-hours";
import { paymentOptions, type PaymentMethod } from "@/lib/payments";
import type { RestaurantConfig } from "@/lib/restaurant";
import type { BasketLine } from "./basket";
export type CheckoutDetails = { name: string; phone: string; email: string; instructions: string; company: string; paymentMethod: PaymentMethod };
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
  config: RestaurantConfig;
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
    config,
  } = props;
  const hoursMap = useMemo(() => parseHours(config.openingHours as unknown as Record<string, { open: string; close: string } | null>), [config.openingHours]);
  const [openNow] = useState(() => isRestaurantOpenNow(hoursMap));
  const payOptions = paymentOptions(config);
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
            Collection time
          </legend>
          {!openNow ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
              <p className="font-semibold text-red-800">🔴 We are currently closed</p>
              <p className="mt-2 text-red-700">You can still order ahead for our next opening below.</p>
              <p className="mt-2 text-red-700">Opening hours: {config.hoursSummary}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-semibold text-green-800">🟢 Online ordering open</p>
              <p className="mt-2 text-green-700">
                We aim to have collection orders ready for your chosen time. If there is a significant delay, a member
                of our team will contact you using the telephone number provided.
              </p>
              <p className="mt-2 text-green-700">Opening hours: {config.hoursSummary}</p>
            </div>
          )}
          {days.length === 0 ? (
            <p className="mt-3 rounded-xl bg-cream-dark p-3 text-sm text-charcoal/70">
              No collection slots are available online right now. Please call us on {config.phoneDisplay}.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={fieldId("day")} className="label">Day</label>
                <select
                  id={fieldId("day")}
                  className="input"
                  value={slot.date}
                  onChange={(e) => {
                    const day = days.find((d) => d.date === e.target.value);
                    onSlot({ date: e.target.value, time: day?.times[0] ?? "" });
                  }}
                >
                  {days.map((d) => (
                    <option key={d.date} value={d.date}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={fieldId("time")} className="label">Time</label>
                <select id={fieldId("time")} className="input" value={slot.time} onChange={(e) => onSlot({ ...slot, time: e.target.value })}>
                  {(selectedDay?.times ?? []).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-charcoal/85">Payment</legend>
          <div className="space-y-2" role="radiogroup" aria-label="Payment method">
            {payOptions.map((option) => (
              <label
                key={option.id}
                className={`flex gap-3 rounded-xl border p-3 text-sm ${option.available ? "cursor-pointer border-sand bg-white" : "border-sand bg-cream-dark/60 opacity-70"}`}
              >
                <input
                  type="radio"
                  name={`${fieldId("payment")}`}
                  value={option.id}
                  disabled={!option.available}
                  checked={details.paymentMethod === option.id}
                  onChange={() => onDetails({ paymentMethod: option.id })}
                  className="mt-1"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {option.id === "pay_on_collection" ? <Wallet className="h-4 w-4 text-gold-deep" aria-hidden="true" /> : <CreditCard className="h-4 w-4 text-gold-deep" aria-hidden="true" />}
                    {option.label}
                    {option.badge ? <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gold-deep uppercase">{option.badge}</span> : null}
                  </span>
                  <span className="mt-0.5 block text-charcoal/65">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
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
            placeholder="Allergies or anything we should know…"
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

        {details.paymentMethod === "pay_on_collection" ? <PaymentNotice notice={config.paymentNotice} compact /> : null}

        {!orderingEnabled ? (
          <p role="alert" className="rounded-xl bg-chili/10 p-3 text-sm font-medium text-chili">
            {pausedMessage || `Online ordering is paused at the moment. Please call us on ${config.phoneDisplay}.`}
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
          Collection only from {config.addressLine}. Questions? Call{" "}
          <a href={config.phoneHref} className="font-semibold underline">
            {config.phoneDisplay}
          </a>
          .
        </p>
      </form>
    </div>
  );
}
