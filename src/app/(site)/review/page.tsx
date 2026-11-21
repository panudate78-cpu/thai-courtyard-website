import type { Metadata } from "next";
import Link from "next/link";
import { QrCode, Star, MapPin, Phone, Heart } from "lucide-react";
import { JsonLd, PageHero } from "@/components/ui";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Love Demo Restaurant? Leave a Google Review — Sample Town",
  description:
    "Loved your meal at Demo Restaurant, Sample Town? Leave a Google review in 30 seconds and help neighbours near Sample Town discover authentic Thai food. 123 High Street, KT9 1AB.",
  alternates: { canonical: "/review" },
  openGraph: {
    title: "Leave a Google Review — Demo Restaurant Sample Town",
    description: "30 seconds to help your local Thai thrive. Review us on Google — Demo Restaurant, 123 High Street, KT9 1AB, near Sample Town.",
    url: "/review",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

const FAQS = [
  { question: "How do I leave a Google review?", answer: "Tap the gold “Leave a Google review” button — it opens Google. Choose a star rating, add a sentence about your favourite dish or service, and publish. It takes ~30 seconds." },
  { question: "Do reviews really help?", answer: "Hugely. Most diners searching “Thai restaurant near me” or “Thai takeaway Sample Town” read recent Google reviews first. Your words help neighbours discover us and help our family-run kitchen when business is quieter." },
  { question: "Can I share Demo Restaurant with friends instead?", answer: "Yes — tap “Share on WhatsApp” or copy the link to send our menu or order page to a friend in Molesey, Sample Town, Thames Ditton or Esher." },
];

export default function ReviewPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Leave a review", path: "/review" }])} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHero
        eyebrow="Thank you for visiting"
        title="Loved your Thai? Leave a review"
        intro="Your Google reviews keep our family-run restaurant thriving — and help neighbours across Sample Town & Sample Town find authentic Thai food near them."
      >
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
            <Star aria-hidden="true" /> Leave a Google review — 30 sec
          </a>
          <Link href="/menu" className="btn btn-outline-light">
            View our menu
          </Link>
        </div>
      </PageHero>

      <section className="container-x py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-8">
            <h2 className="font-serif text-3xl font-semibold">How your review helps (while business is quieter)</h2>
            <p className="mt-3 leading-relaxed text-charcoal/70">
              We’re a small, independent Thai restaurant on Walton Road. When you leave a fresh Google review, Google shows Demo Restaurant more often for searches like <em>Thai restaurant Sample Town</em>, <em>Thai takeaway Sample Town</em> and <em>best Thai near me</em>. That visibility brings new diners through the door — especially during slower weeks.
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-charcoal/75">
              <li className="flex gap-3"><Heart className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" /> Mention what you loved: a dish (e.g. Panang curry, Pad Thai), our BYOB welcome, or family-friendly service.</li>
              <li className="flex gap-3"><Star className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" /> Photos help even more — if you snapped your meal, add it.</li>
              <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true" /> Google loves mentions of <em>Sample Town</em> and <em>Sample Town</em> — it reinforces local SEO.</li>
            </ul>
            <a href={SITE.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-8 w-full sm:w-auto">
              <Star aria-hidden="true" /> Yes — I&apos;ll leave a review
            </a>
            <p className="mt-3 text-xs text-charcoal/45">Opens Google in a new tab. Thank you — every review counts.</p>
          </div>
          <div className="space-y-6">
            <div className="card p-6 text-center">
              <QrCode className="mx-auto h-10 w-10 text-gold-deep" aria-hidden="true" />
              <h3 className="mt-3 font-serif text-2xl font-semibold">Show this to a table mate</h3>
              <p className="mt-2 text-sm text-charcoal/65">Scan or share this page: tell a friend to search “Demo Restaurant Sample Town” or share our link.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Demo Restaurant — authentic Thai in Sample Town, near Sample Town. ${SITE.url} — dine in, takeaway collection & Deliveroo. Check the menu!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-dark"
                >
                  Share on WhatsApp
                </a>
                <Link href="/order" className="btn btn-outline">
                  Order collection
                </Link>
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-serif text-xl font-semibold">Visit us</h3>
              <p className="mt-2 text-sm text-charcoal/75">{SITE.addressLine} • {SITE.hoursSummary}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={SITE.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <MapPin aria-hidden="true" /> Google Maps
                </a>
                <a href={SITE.phoneHref} className="btn btn-outline">
                  <Phone aria-hidden="true" /> {SITE.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="rounded-2xl bg-gold/10 p-5 text-sm leading-relaxed text-charcoal/70 ring-1 ring-gold/20">
              <strong className="text-charcoal">Prefer to give feedback privately?</strong> Message us via <Link href="/contact" className="font-semibold text-gold-deep hover:underline">Contact</Link> — we read every note and reply within a day.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream-dark py-12">
        <div className="container-x max-w-3xl text-center">
          <h2 className="font-serif text-2xl font-semibold sm:text-3xl">Other ways to help right now</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <h3 className="font-semibold">Order collection</h3>
              <p className="mt-1 text-sm text-charcoal/65">Freshly cooked, ~20 mins, pay on collection. No delivery fees.</p>
              <Link href="/order" className="btn btn-gold mt-4 w-full">Order online</Link>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold">Book a table</h3>
              <p className="mt-1 text-sm text-charcoal/65">Cosy, family-friendly, BYOB. Perfect for Sample Town visits.</p>
              <Link href="/book" className="btn btn-dark mt-4 w-full">Book now</Link>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold">Share the menu</h3>
              <p className="mt-1 text-sm text-charcoal/65">Send a dish idea to a friend nearby — referrals warm leads fastest.</p>
              <Link href="/menu" className="btn btn-outline mt-4 w-full">View menu</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
