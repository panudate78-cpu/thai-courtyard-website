import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Banknote, Bike, CreditCard, Flame, Leaf, Nut, Sprout, Star, WheatOff } from "lucide-react";
import { DIETARY, DIETARY_KEYS, type DietaryKey, type DietaryTone } from "@/lib/dietary";
import type { OpeningHoursMap } from "@/lib/hours";
import type { SiteImage } from "@/lib/image-manifest";
import { DAY_NAMES, DEFAULT_OPENING_HOURS, DEFAULT_RESTAURANT } from "@/lib/site";

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

/** Wrap a configured image URL (Business Settings) as a SiteImage. */
export function imgFromUrl(src: string, alt: string, width = 1800, height = 1200): SiteImage {
  return { src, alt, width, height };
}

export function isUnoptimised(src: string) {
  return src.startsWith("data:") || src.endsWith(".svg");
}

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
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: SiteImage;
  children?: ReactNode;
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
          unoptimized={isUnoptimised(image.src)}
          {...(image.blurDataURL ? { placeholder: "blur" as const, blurDataURL: image.blurDataURL } : {})}
          className="-z-20 object-cover opacity-45"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-charcoal/70 via-charcoal/75 to-charcoal" aria-hidden="true" />
      <div className="brand-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
      <div className="container-x py-16 text-center sm:py-20 lg:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight font-semibold text-cream sm:text-5xl lg:text-6xl">{title}</h1>
        <Ornament className="mx-auto mt-5" />
        {intro ? <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-cream/80 sm:text-lg">{intro}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function PaymentNotice({
  notice = "Payment will be taken in the restaurant when you collect your order. We accept cash and card.",
  className = "",
  compact = false,
}: {
  notice?: string;
  className?: string;
  compact?: boolean;
}) {
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
        <strong className="font-semibold">Pay on collection.</strong> {notice}
      </p>
    </div>
  );
}

export function DeliveryButton({
  delivery,
  className = "",
  label,
}: {
  delivery: { enabled: boolean; url: string; label: string };
  className?: string;
  label?: string;
}) {
  if (!delivery.enabled || !delivery.url) return null;
  return (
    <a href={delivery.url} target="_blank" rel="noopener noreferrer" className={`btn btn-delivery ${className}`}>
      <Bike aria-hidden="true" />
      {label || delivery.label || "Order Delivery"}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function OpeningHours({
  hours = DEFAULT_OPENING_HOURS,
  dark = false,
  className = "",
}: {
  hours?: OpeningHoursMap;
  dark?: boolean;
  className?: string;
}) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <dl className={`divide-y text-sm ${dark ? "divide-cream/10 text-cream/80" : "divide-sand text-charcoal/80"} ${className}`}>
      {order.map((day) => {
        const dayHours = hours[day];
        return (
          <div key={day} className="flex items-center justify-between gap-4 py-2">
            <dt className="font-medium">{DAY_NAMES[day]}</dt>
            <dd className={dayHours ? "" : dark ? "text-cream/45" : "text-charcoal/45"}>
              {dayHours ? `${dayHours.open} – ${dayHours.close}` : "Closed"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Logo image that works with uploaded data URLs, SVGs and remote URLs. */
export function BrandLogo({
  logoUrl,
  name,
  width = 50,
  height = 50,
  className = "h-10 w-auto lg:h-12",
}: {
  logoUrl: string;
  name: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const src = logoUrl || DEFAULT_RESTAURANT.logoUrl;
  return <Image src={src} alt={`${name} logo`} width={width} height={height} loading="eager" unoptimized={isUnoptimised(src)} className={className} />;
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Brand icons (Lucide no longer ships brand logos). */
export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.6v3H11v7h2.5Z" />
    </svg>
  );
}

export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
