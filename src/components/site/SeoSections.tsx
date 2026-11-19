"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, Star, Share2, Copy, Check } from "lucide-react";
import { SITE } from "@/lib/site";

export type FaqItem = { question: string; answer: string };

export function FaqSection({ items, heading = "Frequently asked questions" }: { items: FaqItem[]; heading?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-16 lg:py-20" aria-labelledby="faq-heading">
      <div className="container-x max-w-4xl">
        <p className="eyebrow-dark text-center">{heading}</p>
        <h2 id="faq-heading" className="mt-3 text-center font-serif text-3xl font-semibold sm:text-4xl">
          Good to know before you visit
        </h2>
        <div className="mt-10 divide-y divide-sand overflow-hidden rounded-2xl border border-sand bg-white">
          {items.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-gold-deep transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {isOpen ? <p className="px-6 pb-6 text-sm leading-relaxed text-charcoal/70">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
        <div itemScope itemType="https://schema.org/FAQPage" className="sr-only">
          {items.map((item) => (
            <div key={item.question} itemProp="mainEntity" itemScope itemType="https://schema.org/Question">
              <span itemProp="name">{item.question}</span>
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <span itemProp="text">{item.answer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AreasServed() {
  return (
    <section className="bg-cream-dark py-16 lg:py-20" aria-labelledby="areas-heading">
      <div className="container-x">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow-dark">Local & loved</p>
          <h2 id="areas-heading" className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            Your local Thai — East Molesey, Hampton Court & beyond
          </h2>
          <p className="mt-4 leading-relaxed text-charcoal/70">
            Tucked on Walton Road (KT8 0DR), a two-minute stroll from Hampton Court Palace and Bushy Park, Thai Courtyard is the
            go-to Thai restaurant for East Molesey, West Molesey, Thames Ditton, Hampton, Teddington, Esher and Walton-on-Thames. Whether
            you&apos;re searching for <em>Thai takeaway near me</em>, <em>best Thai near Hampton Court</em> or a cosy spot for a family
            dinner in Surrey, you&apos;ll find freshly cooked Thai food here — dine-in, collection or Deliveroo delivery.
          </p>
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {SITE.areaServed.map((area) => (
            <span key={area} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-teak/10">
              <MapPin className="h-3 w-3 text-gold-deep" aria-hidden="true" />
              Thai restaurant {area}
            </span>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-charcoal/50">
          Hampton Court Palace • Bushy Park • Molesey Heath • River Thames • Thames Ditton • Hampton Station • East Molesey High Street — all
          within a short drive or walk of Thai Courtyard, 105 Walton Road.
        </p>
      </div>
    </section>
  );
}

export function LocalTrustStrip() {
  return (
    <section aria-label="Why locals choose us" className="border-y border-sand bg-white py-6">
      <div className="container-x flex flex-wrap items-center justify-center gap-6 text-center text-sm">
        <span className="inline-flex items-center gap-2 font-semibold">
          <Star className="h-4 w-4 text-gold" aria-hidden="true" /> 4.8 on Google (loved by locals)
        </span>
        <span className="hidden h-4 w-px bg-sand sm:block" aria-hidden="true" />
        <span>Freshly cooked to order • Tue–Sat 12:00–21:00</span>
        <span className="hidden h-4 w-px bg-sand sm:block" aria-hidden="true" />
        <span>BYOB — bring your own alcohol, corkage applies</span>
        <span className="hidden h-4 w-px bg-sand sm:block" aria-hidden="true" />
        <span>Collection in ~20 mins • Pay on collection</span>
      </div>
    </section>
  );
}

export function ShareCta({ title, text }: { title?: string; text?: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : SITE.url;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || SITE.fullName, text: text || SITE.description, url });
        return;
      } catch {}
    }
    copy();
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className="btn btn-dark">
        <Share2 aria-hidden="true" /> Share with friends
      </button>
      <button type="button" onClick={copy} className="btn btn-outline">
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title || SITE.fullName} — ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline"
      >
        Share on WhatsApp
      </a>
    </div>
  );
}

export function ReviewFunnel() {
  return (
    <section className="bg-charcoal py-12 text-cream">
      <div className="container-x flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <div className="max-w-xl">
          <p className="eyebrow">Help us grow • business is built on reviews</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold">Loved your takeaway or dine-in?</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/70">
            A quick Google review helps neighbours in East Molesey & Hampton Court discover authentic Thai food — and keeps our
            family-run restaurant thriving. It takes 30 seconds.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
            <Star aria-hidden="true" /> Leave a Google review
          </a>
          <Link href="/contact" className="btn btn-outline-light">
            Send us feedback
          </Link>
        </div>
      </div>
    </section>
  );
}
