import { NextResponse, type NextRequest } from "next/server";
import { sendMail } from "@/lib/email";

export const dynamic = "force-dynamic";

function tokenOk(req: NextRequest): boolean {
  const env = process.env.SETUP_TOKEN;
  if (!env) return true;
  return req.headers.get("x-setup-token") === env || req.nextUrl.searchParams.get("token") === env;
}

export async function POST(req: NextRequest) {
  if (!tokenOk(req)) return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });
  let to: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { to?: unknown; token?: unknown };
    to = typeof body.to === "string" ? body.to : undefined;
    const envToken = process.env.SETUP_TOKEN;
    const bodyToken = typeof body.token === "string" ? body.token : undefined;
    if (envToken && bodyToken !== envToken && req.headers.get("x-setup-token") !== envToken && req.nextUrl.searchParams.get("token") !== envToken) {
      return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });
    }
  } catch {}
  const recipient = to || process.env.RESTAURANT_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || process.env.SMTP_USER || "";
  if (!recipient || !recipient.includes("@")) return NextResponse.json({ error: "No recipient — set RESTAURANT_EMAIL or provide ?to=email" }, { status: 400 });

  const result = await sendMail({
    to: recipient,
    subject: "Thai Courtyard template — test email ✓",
    html: `<p>This is a test email from your Thai Courtyard white-label setup wizard.</p><p>If you received this, email delivery is working — orders, bookings and contact messages will arrive at <strong>${recipient}</strong>.</p><p style="color:#666;font-size:12px">Sent at ${new Date().toISOString()}</p>`,
    text: `Test email OK — ${new Date().toISOString()}`,
  });

  if (result === "sent") return NextResponse.json({ ok: true, message: `Test email sent to ${recipient}` });
  if (result === "logged") return NextResponse.json({ ok: true, message: `Email provider not configured — logged to server console (would have gone to ${recipient})` });
  return NextResponse.json({ error: "Email delivery failed — check SMTP_* / RESEND_API_KEY and server logs" }, { status: 500 });
}
