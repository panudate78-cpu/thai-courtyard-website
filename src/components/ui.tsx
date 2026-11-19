import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Banknote, Bike, CreditCard, Flame, Leaf, Nut, Sprout, Star, WheatOff } from "lucide-react";
import { DIETARY, DIETARY_KEYS, type DietaryKey, type DietaryTone } from "@/lib/dietary";
import type { SiteImage } from "@/lib/image-manifest";
import { DAY_NAMES, OPENING_HOURS, SITE } from "@/lib/site";

const DIETARY_ICONS: Record<DietaryKey, LucideIcon> = {
  vegetarian: Leaf,
  vegan: Sprout,
  veg_option: Leaf,
  spicy: Flame,
  nuts: Nut,
  gluten_free: WheatOff,
  popular: Star,
};

const TONES: Record<DietaryTone, string> = {
  jade: "bg-jade/10 text-jade ring-jade/25",
  chili: "bg-chili/10 text-chili ring-chili/25",
  teak: "bg-teak/10 text-teak-dark ring-teak/25",
  gold: "bg-gold/15 text-gold-deep ring-gold/35",
};

export function DietaryBadges({ tags, className = "" }: { tags: DietaryKey[]; className?: string }) {
  const shown = tags.includes("vegan") ? tags.filter((t) => t !== "vegetarian") : tags;
  if (!shown.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Dietary information">
      {shown.map((tag) => {
        const info = DIETARY[tag];
        const Icon = DIETARY_ICONS[tag];
        return (
          <li
            key={tag}
            title={info.label}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[info.tone]}`}
          >
            <Icon aria-hidden="true" className="h-3 w-3" />
            <span aria-hidden="true">{info.short}</span>
            <span className="sr-only">{info.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function DietaryLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-sm text-charcoal/75 ${className}`}>
      {DIETARY_KEYS.map((key) => {
        const info = DIETARY[key];
        const Icon = DIETARY_ICONS[key];
        return (
          <li key={key} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONES[info.tone]}`}
            >
              <Icon className="h-3 w-3" />
              {info.short}
            </span>
            <span>{info.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 20" className={`h-4 w-40 text-gold ${className}`} fill="none">
      <path d="M0 10h80M120 10h80" stroke="currentColor" strokeWidth="1" />
      <path d="M100 1.5l8.5 8.5-8.5 8.5-8.5-8.5z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M100 6l4 4-4 4-4-4z" fill="currentColor" />
      <circle cx="86" cy="10" r="1.6" fill="currentColor" />
      <circle cx="114" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  dark = false,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  dark?: boolean;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className={dark ? "eyebrow" : "eyebrow-dark"}>{eyebrow}</p> : null}
      <h2
        className={`mt-3 font-serif text-4xl leading-tight font-semibold sm:text-5xl ${dark ? "text-cream" : "text-charcoal"}`}
      >
        {title}
      </h2>
      <Ornament className={`mt-4 ${centered ? "mx-auto" : ""}`} />
      {intro ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-cream/75" : "text-charcoal/70"}`}>{intro}</p>
      ) : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  children,
  compact = true,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: SiteImage;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal text-cream">
      {image ? (
        <Image
          src={image.src}
          alt=""
          fill
          preload
          sizes="100vw"
          placeholder="blur"
          blurDataURL={image.blurDataURL}
          className="-z-20 object-cover opacity-45"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-charcoal/70 via-charcoal/75 to-charcoal" aria-hidden="true" />
      <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className={compact ? "container-x py-8 text-center sm:py-10 lg:py-12" : "container-x py-16 text-center sm:py-20 lg:py-24"}>
        <p className="eyebrow">{eyebrow}</p>
        <h1
          className={
            compact
              ? "mt-2 font-serif text-3xl leading-tight font-semibold text-cream sm:text-4xl lg:text-[2.6rem]"
              : "mt-3 font-serif text-4xl leading-tight font-semibold text-cream sm:text-5xl lg:text-6xl"
          }
        >
          {title}
        </h1>
        <Ornament className={compact ? "mx-auto mt-3 h-3 w-32" : "mx-auto mt-5"} />
        {intro ? (
          <p
            className={
              compact
                ? "mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-cream/80 sm:text-[15px]"
                : "mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/80 sm:text-lg"
            }
          >
            {intro}
          </p>
        ) : null}
        {children ? <div className={compact ? "mt-5" : "mt-8"}>{children}</div> : null}
      </div>
    </section>
  );
}

export function PaymentNotice({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-xl border border-gold/40 bg-gold/10 text-charcoal ${compact ? "p-3 text-xs" : "p-4 text-sm"} ${className}`}
    >
      <span className="flex shrink-0 gap-1 pt-0.5 text-gold-deep" aria-hidden="true">
        <Banknote className="h-5 w-5" />
        <CreditCard className="h-5 w-5" />
      </span>
      <p className="leading-relaxed">
        <strong className="font-semibold">No online payment.</strong> {SITE.paymentNotice}
      </p>
    </div>
  );
}

export function DeliverooButton({
  className = "",
  label = "Order Delivery via Deliveroo",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a href={SITE.deliverooUrl} target="_blank" rel="noopener noreferrer" className={`btn btn-deliveroo ${className}`}>
      <Bike aria-hidden="true" />
      {label}
      <span className="sr-only"> (opens Deliveroo in a new tab)</span>
    </a>
  );
}

export function OpeningHours({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const order = [2, 3, 4, 5, 6, 0, 1];
  return (
    <dl className={`divide-y text-sm ${dark ? "divide-cream/10 text-cream/80" : "divide-sand text-charcoal/80"} ${className}`}>
      {order.map((day) => {
        const hours = OPENING_HOURS[day];
        return (
          <div key={day} className="flex items-center justify-between gap-4 py-2">
            <dt className="font-medium">{DAY_NAMES[day]}</dt>
            <dd className={hours ? "" : dark ? "text-cream/45" : "text-charcoal/45"}>
              {hours ? `${hours.open} – ${hours.close}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
