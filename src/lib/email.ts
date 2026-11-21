import nodemailer, { type Transporter } from "nodemailer";
import { escapeHtml as e, formatPrice } from "./format";
import { formatDateLong } from "./hours";
import { SITE } from "./site";
import { getRestaurantConfig } from "./restaurant";
import type { BookingView, OrderView, Settings } from "./types";

export type MailResult = "sent" | "logged" | "failed";
type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string | null };

let transport: Transporter | null = null;

export function emailProvider(): "resend" | "smtp" | null {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST) return "smtp";
  return null;
}

/** Where restaurant notifications go: admin setting first, then environment. */
export function restaurantEmail(settings?: Pick<Settings, "notificationEmail"> | null) {
  return settings?.notificationEmail || process.env.RESTAURANT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || null;
}
export async function restaurantEmailAsync(settings?: Pick<Settings, "notificationEmail"> | null): Promise<string | null> {
  const fromSettings = settings?.notificationEmail || process.env.RESTAURANT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL;
  if (fromSettings) return fromSettings;
  try {
    const cfg = await getRestaurantConfig();
    return cfg.restaurantEmail || cfg.orderEmail || cfg.email || null;
  } catch {
    return null;
  }
}

function fromAddressSync() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER && process.env.SMTP_USER.includes("@")) return `Demo Restaurant <${process.env.SMTP_USER}>`;
  return "Demo Restaurant <onboarding@resend.dev>";
}
async function fromAddress(): Promise<string> {
  try {
    const cfg = await getRestaurantConfig();
    if (cfg.emailFrom) return cfg.emailFrom;
    if (cfg.restaurantName && cfg.restaurantName !== "Thai Courtyard") return `${cfg.restaurantName} <${cfg.email}>`;
  } catch {}
  return fromAddressSync();
}
function fromAddressForTemplate(cfgName?: string, cfgEmailFrom?: string | null, cfgEmail?: string | null) {
  if (cfgEmailFrom) return cfgEmailFrom;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const name = cfgName || "Demo Restaurant";
  const email = cfgEmail || process.env.SMTP_USER || "onboarding@resend.dev";
  const addr = email.includes("@") ? email : "onboarding@resend.dev";
  return `${name} <${addr}>`;
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const provider = emailProvider();
  if (!provider) {
    console.info(`[email:not-configured] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return "logged";
  }
  try {
    if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: await fromAddress(),
          to: [mail.to],
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
      return "sent";
    }
    if (!transport) {
      const port = Number(process.env.SMTP_PORT || 587);
      transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
      });
    }
    await transport.sendMail({
      from: await fromAddress(),
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo ?? undefined,
    });
    return "sent";
  } catch (error) {
    console.error("[email] failed to send", error);
    return "failed";
  }
}

/* ----------------------------- Templates ----------------------------- */

function shell(heading: string, body: string, cfg?: { restaurantName?: string; addressLine?: string; phoneDisplay?: string } | null) {
  const name = cfg?.restaurantName || "Demo Restaurant";
  const locality = cfg?.addressLine ? cfg.addressLine.split(",").slice(1).join(",").trim() || "Sample Town" : "Sample Town";
  const addr = cfg?.addressLine || SITE.addressLine;
  const phone = cfg?.phoneDisplay || SITE.phoneDisplay;
  return `<!doctype html><html><body style="margin:0;background:#f4eee3;font-family:Arial,Helvetica,sans-serif;color:#1d1b1a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4eee3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#1d1b1a;padding:22px 26px"><div style="font-family:Georgia,serif;font-size:24px;color:#e3c77f">${name}</div><div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#faf6ee;opacity:.7;margin-top:4px">${locality}</div></td></tr>
<tr><td style="padding:26px"><h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 16px;color:#1d1b1a">${heading}</h1>${body}</td></tr>
<tr><td style="padding:16px 26px;background:#faf6ee;font-size:12px;color:#6b4226">${addr} · ${phone}</td></tr>
</table></td></tr></table></body></html>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 12px 6px 0;color:#7a5c1c;font-size:13px;width:150px;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:14px;vertical-align:top">${value}</td></tr>`;
}

function optionsText(options: OrderView["items"][number]["options"]) {
  return options.map((o) => `${o.choice}${o.pricePence ? ` (+${formatPrice(o.pricePence)})` : ""}`).join(", ");
}

function itemsTable(order: OrderView) {
  const rows = order.items
    .map(
      (i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #eee4d3;font-size:14px;vertical-align:top"><strong>${i.quantity} × ${e(i.name)}</strong>${
        i.options.length ? `<div style="font-size:12px;color:#6f6a64;margin-top:3px">${e(optionsText(i.options))}</div>` : ""
      }</td><td style="padding:10px 0;border-bottom:1px solid #eee4d3;font-size:14px;text-align:right;vertical-align:top">${formatPrice(i.lineTotalPence)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">${rows}<tr><td style="padding:12px 0;font-size:16px"><strong>Total to pay on collection</strong></td><td style="padding:12px 0;font-size:16px;text-align:right"><strong>${formatPrice(order.subtotalPence)}</strong></td></tr></table>`;
}

function itemsText(order: OrderView) {
  return order.items
    .map((i) => `${i.quantity} x ${i.name}${i.options.length ? ` [${optionsText(i.options)}]` : ""} — ${formatPrice(i.lineTotalPence)}`)
    .join("\n");
}

const notice = `<p style="background:#f8f0dc;border:1px solid #e6cf97;border-radius:10px;padding:12px 14px;font-size:13px;margin:0">${SITE.paymentNotice}</p>`;
function paymentBadge(order: OrderView): string {
  const method = (order as unknown as { paymentMethod?: string }).paymentMethod || "pay_on_collection";
  const status = (order as unknown as { paymentStatus?: string }).paymentStatus || "paid";
  if (method === "stripe_online") {
    if (status === "paid") return `<span style="display:inline-block;background:#dcfce7;border:1px solid #86efac;color:#14532d;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">✓ Paid online (Stripe)</span>`;
    return `<span style="display:inline-block;background:#fef9c3;border:1px solid #fde047;color:#713f12;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">Awaiting online payment</span>`;
  }
  return `<span style="display:inline-block;background:#f3f4f6;border:1px solid #d1d5db;color:#111827;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700">Pay on collection (cash/card)</span>`;
}
function paymentNoticeFor(order: OrderView): string {
  const method = (order as unknown as { paymentMethod?: string }).paymentMethod || "pay_on_collection";
  const status = (order as unknown as { paymentStatus?: string }).paymentStatus || "paid";
  if (method === "stripe_online" && status === "paid") return `<p style="background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:12px 14px;font-size:13px;margin:0">✓ This order was <strong>paid online via Stripe</strong> — no payment needed on collection.</p>`;
  if (method === "stripe_online") return `<p style="background:#fef9c3;border:1px solid #fde047;border-radius:10px;padding:12px 14px;font-size:13px;margin:0">Awaiting online payment — this order will be confirmed once Stripe payment succeeds.</p>`;
  return notice;
}

export function orderRestaurantEmail(order: OrderView) {
  const when = `${formatDateLong(order.collectionDate)} at ${order.collectionTime}`;
  const html = shell(
    `New collection order #${order.number}`,
    `<table role="presentation" cellpadding="0" cellspacing="0">${row("Collection", `<strong>${e(when)}</strong>`)}${row(
      "Customer",
      e(order.customerName),
    )}${row("Telephone", `<a href="tel:${e(order.phone.replace(/\s/g, ""))}">${e(order.phone)}</a>`)}${row(
      "Email",
      order.email ? e(order.email) : "—",
    )}${row("Payment", paymentBadge(order))}${order.instructions ? row("Special instructions", `<strong style="color:#a12d24">${e(order.instructions)}</strong>`) : ""}</table>${itemsTable(
      order,
    )}${paymentNoticeFor(order)}<p style="margin:20px 0 0"><a href="${SITE.url}/admin/orders" style="display:inline-block;background:#c9a14a;color:#1d1b1a;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">Open admin dashboard</a></p>`,
  );
  const paymentText = (order as unknown as { paymentMethod?: string }).paymentMethod === "stripe_online" ? ((order as unknown as { paymentStatus?: string }).paymentStatus === "paid" ? "PAID ONLINE (Stripe)" : "AWAITING ONLINE PAYMENT") : "PAY ON COLLECTION";
  const text = `NEW COLLECTION ORDER #${order.number} [${paymentText}]\nCollection: ${when}\nCustomer: ${order.customerName}\nTelephone: ${order.phone}\nEmail: ${
    order.email ?? "-"
  }\n${order.instructions ? `Special instructions: ${order.instructions}\n` : ""}\n${itemsText(order)}\n\nTOTAL: ${formatPrice(
    order.subtotalPence,
  )} — ${paymentText}\n\nManage orders: ${SITE.url}/admin/orders`;
  return {
    subject: `New collection order #${order.number} · ${order.collectionTime} ${formatDateLong(order.collectionDate)} · ${order.customerName}`,
    html,
    text,
  };
}

export function orderCustomerEmail(order: OrderView) {
  const when = `${formatDateLong(order.collectionDate)} at ${order.collectionTime}`;
  const isStripePaid = (order as unknown as { paymentMethod?: string }).paymentMethod === "stripe_online" && (order as unknown as { paymentStatus?: string }).paymentStatus === "paid";
  const heading = isStripePaid ? `Thank you, ${e(order.customerName)} — your order is confirmed and paid` : `Thank you, ${e(order.customerName)} — we've received your order`;
  const introPaid = `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Your collection order <strong>#${order.number}</strong> is <strong>paid online</strong> and has been sent to our kitchen.</p>`;
  const introPayOnCollection = `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Your collection order <strong>#${order.number}</strong> has been sent to our kitchen.</p>`;
const html = shell(
heading,
`${isStripePaid ? introPaid : introPayOnCollection}
 
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">We aim to have collection orders ready within approximately 30 minutes.</p>
 
<p style="font-size:15px;line-height:1.6;margin:0 0 12px">During busy periods preparation may take a little longer. If there is a significant delay, a member of our team will contact you using the telephone number provided.</p>
 
<table role="presentation" cellpadding="0" cellspacing="0">
${row(
"Collection time",
`<strong>${e(when)}</strong>`,
)}
${row("Collect from", e(SITE.addressLine))}
</table>
${itemsTable(order)}
${paymentNoticeFor(order)}
<p style="font-size:13px;color:#6f6a64;margin:18px 0 0">${paymentBadge(order)}<br>
Need to change something? Call us on
<a href="${SITE.phoneHref}">${SITE.phoneDisplay}</a>.</p>`,
  );  
const paymentText2 = (order as unknown as { paymentMethod?: string }).paymentMethod === "stripe_online" && (order as unknown as { paymentStatus?: string }).paymentStatus === "paid" ? "Paid online via Stripe — no payment needed on collection." : SITE.paymentNotice;
  const text = `Thank you, ${order.customerName}! We've received your collection order #${order.number}.

We aim to have collection orders ready within approximately 30 minutes.

If there is a significant delay, a member of our team will contact you using the telephone number provided.

Collection: ${when}
Collect from: ${SITE.addressLine}

${itemsText(order)}

Total: ${formatPrice(order.subtotalPence)}
${paymentText2}

Questions? Call ${SITE.phoneDisplay}.`;
  return { subject: `Your order #${order.number} — collection ${order.collectionTime} — ${SITE.name}`, html, text };
}

export function orderReadyEmail(order: OrderView) {
  const html = shell(
    `Your order #${order.number} is ready`,
    `<p style="font-size:15px;line-height:1.6">Good news, ${e(order.customerName)} — your order is ready to collect from ${e(SITE.addressLine)}.</p>${notice}`,
  );
  return {
    subject: `Your order #${order.number} is ready to collect — ${SITE.name}`,
    html,
    text: `Good news, ${order.customerName} — your order #${order.number} is ready to collect from ${SITE.addressLine}.\n${SITE.paymentNotice}`,
  };
}

export function bookingRestaurantEmail(b: BookingView) {
  const when = `${formatDateLong(b.date)} at ${b.time}`;
  const html = shell(
    `New table booking request`,
    `<table role="presentation" cellpadding="0" cellspacing="0">${row("When", `<strong>${e(when)}</strong>`)}${row("Guests", String(b.partySize))}${row(
      "Name",
      e(b.name),
    )}${row("Telephone", e(b.phone))}${row("Email", b.email ? e(b.email) : "—")}${b.notes ? row("Notes", e(b.notes)) : ""}</table><p style="margin:20px 0 0"><a href="${SITE.url}/admin/bookings" style="display:inline-block;background:#c9a14a;color:#1d1b1a;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">Confirm in admin</a></p>`,
  );
  const text = `NEW TABLE BOOKING REQUEST\nWhen: ${when}\nGuests: ${b.partySize}\nName: ${b.name}\nTelephone: ${b.phone}\nEmail: ${b.email ?? "-"}\n${
    b.notes ? `Notes: ${b.notes}\n` : ""
  }\nManage bookings: ${SITE.url}/admin/bookings`;
  return { subject: `Booking request: ${b.partySize} guests · ${b.time} ${formatDateLong(b.date)} · ${b.name}`, html, text };
}

export function bookingCustomerEmail(b: BookingView, kind: "received" | "confirmed" | "declined") {
  const when = `${formatDateLong(b.date)} at ${b.time}`;
  const copy = {
    received: {
      subject: "We've received your booking request",
      heading: "Thank you for your booking request",
      body: `We've received your request for a table for <strong>${b.partySize}</strong> on <strong>${e(when)}</strong>. We'll be in touch shortly to confirm.`,
    },
    confirmed: {
      subject: "Your table is confirmed",
      heading: "Your table is confirmed",
      body: `We look forward to welcoming you — table for <strong>${b.partySize}</strong> on <strong>${e(when)}</strong>.`,
    },
    declined: {
      subject: "About your booking request",
      heading: "Sorry, we can't confirm your booking",
      body: `Unfortunately we're unable to accept your booking for <strong>${e(when)}</strong>. Please call us on ${SITE.phoneDisplay} and we'll do our best to find an alternative.`,
    },
  }[kind];
  return {
    subject: `${SITE.name} — ${copy.subject}`,
    html: shell(copy.heading, `<p style="font-size:15px;line-height:1.6">Hello ${e(b.name)},</p><p style="font-size:15px;line-height:1.6">${copy.body}</p>`),
    text: `Hello ${b.name},\n\n${copy.body.replace(/<[^>]+>/g, "")}\n\nThai Courtyard · ${SITE.addressLine} · ${SITE.phoneDisplay}`,
  };
}

export function contactRestaurantEmail(m: { name: string; email: string; phone: string | null; message: string }) {
  const html = shell(
    "New website enquiry",
    `<table role="presentation" cellpadding="0" cellspacing="0">${row("Name", e(m.name))}${row("Email", e(m.email))}${row(
      "Telephone",
      m.phone ? e(m.phone) : "—",
    )}</table><p style="white-space:pre-wrap;font-size:15px;line-height:1.6;background:#faf6ee;border-radius:10px;padding:14px">${e(m.message)}</p>`,
  );
  return {
    subject: `Website enquiry from ${m.name}`,
    html,
    text: `Website enquiry\nName: ${m.name}\nEmail: ${m.email}\nTelephone: ${m.phone ?? "-"}\n\n${m.message}`,
  };
}
