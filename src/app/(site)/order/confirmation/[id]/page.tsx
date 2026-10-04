import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Navigation, Phone } from "lucide-react";
import { PaymentNotice } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { formatDateLong, londonNow, relativeDayLabel } from "@/lib/hours";
import { getOrderByPublicId } from "@/lib/orders";
import { SITE } from "@/lib/site";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order received",
  robots: { index: false, follow: false },
};

const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: "Received — sent to the kitchen", tone: "bg-gold/15 text-gold-deep" },
  accepted: { label: "Accepted — being prepared", tone: "bg-jade/10 text-jade" },
  ready: { label: "Ready to collect", tone: "bg-jade/15 text-jade" },
  collected: { label: "Collected — enjoy your meal!", tone: "bg-charcoal/10 text-charcoal" },
  cancelled: { label: "Cancelled — please call us", tone: "bg-chili/10 text-chili" },
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderByPublicId(id);
  if (!order) notFound();

  const day = relativeDayLabel(order.collectionDate, londonNow().date);
  const status = STATUS[order.status];
  const firstName = order.customerName.split(" ")[0];

  return (
    <div className="bg-cream-dark">
      <section className="relative isolate overflow-hidden bg-charcoal text-cream">
        <div className="thai-pattern absolute inset-0 -z-10 opacity-60" aria-hidden="true" />
        <div className="container-x py-12 text-center sm:py-16">
          <CheckCircle2 className="mx-auto h-16 w-16 text-gold-light" aria-hidden="true" />
          <h1 className="mt-4 font-serif text-4xl font-semibold sm:text-5xl">Thank you, {firstName}!</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-cream/80">
            Your collection order has been sent to Thai Courtyard. We&apos;ll have it freshly prepared for you.
          </p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-cream/10 px-5 py-2 text-sm ring-1 ring-cream/20">
            Order number <strong className="text-lg text-gold-light">#{order.number}</strong>
          </p>
        </div>
      </section>

      <div className="container-x -mt-6 pb-16">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="card overflow-hidden">
            <div className="grid gap-px bg-sand sm:grid-cols-2">
              <div className="bg-white p-6">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-charcoal/55 uppercase">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Collection time
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold">
                  {day} at {order.collectionTime}
                </p>
                <p className="text-sm text-charcoal/60">{formatDateLong(order.collectionDate)}</p>
              </div>
              <div className="bg-white p-6">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-charcoal/55 uppercase">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> Collect from
                </p>
                <p className="mt-2 font-semibold">Thai Courtyard</p>
                <p className="text-sm text-charcoal/70">{SITE.addressLine}</p>
                <a
                  href={SITE.googleDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-deep hover:underline"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Directions
                </a>
              </div>
            </div>
            <div className="border-t border-sand p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-2xl font-semibold">Your order</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
              </div>
              <ul className="mt-4 divide-y divide-sand">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3">
                    <div>
                      <p className="font-semibold">
                        {item.quantity} × {item.name}
                      </p>
                      {item.options.length ? (
                        <p className="text-sm text-charcoal/60">{item.options.map((o) => o.choice).join(" · ")}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 font-semibold">{formatPrice(item.lineTotalPence)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-sand pt-4 text-lg font-semibold">
                <span>Total to pay on collection</span>
                <span>{formatPrice(order.subtotalPence)}</span>
              </div>
              {order.instructions ? (
                <p className="mt-4 rounded-xl bg-cream p-4 text-sm text-charcoal/75">
                  <strong className="font-semibold text-charcoal">Special instructions:</strong> {order.instructions}
                </p>
              ) : null}
            </div>
          </div>

          <PaymentNotice />

          <div className="card p-6 text-sm leading-relaxed text-charcoal/75">
            <h2 className="font-serif text-xl font-semibold text-charcoal">What happens next?</h2>
            <p className="mt-2">
              Our kitchen has received your order and will have it ready for {order.collectionTime}
              {order.email ? ". A copy has been sent to your email" : ""}. If we have any questions we&apos;ll call you on{" "}
              <strong>{order.phone}</strong>.
            </p>
            <p className="mt-2">
              Need to change something? Call us on{" "}
              <a href={SITE.phoneHref} className="font-semibold text-teak hover:underline">
                {SITE.phoneDisplay}
              </a>{" "}
              and quote order <strong>#{order.number}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/" className="btn btn-dark">
              Back to home
            </Link>
            <a href={SITE.phoneHref} className="btn btn-outline">
              <Phone aria-hidden="true" />
              Call the restaurant
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
