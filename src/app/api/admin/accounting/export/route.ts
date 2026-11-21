import { adminGuard } from "@/lib/auth";
import { accountingNotes, buildAccountingCSV, PROVIDERS, type AccountingProvider } from "@/lib/accounting";
import { ensureDatabase } from "@/db/bootstrap";
import { pool } from "@/db";
import { isValidDateString, londonNow } from "@/lib/hours";

export const dynamic = "force-dynamic";

const VALID: Set<string> = new Set(["quickbooks", "xero", "sage", "freeagent", "generic"]);

function pickProvider(v: string | null): AccountingProvider {
  const p = (v || "generic").toLowerCase();
  return (VALID.has(p) ? p : "generic") as AccountingProvider;
}

export async function GET(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(req.url);
  const provider = pickProvider(url.searchParams.get("provider"));
  const start = url.searchParams.get("start")?.slice(0, 10) || "";
  const end = url.searchParams.get("end")?.slice(0, 10) || "";

  // default to current month if no dates supplied
  const today = londonNow().date;
  const defaultStart = `${today.slice(0, 7)}-01`;
  const s = isValidDateString(start) ? start : defaultStart;
  const e = isValidDateString(end) ? end : today;
  const startIso = s <= e ? s : e;
  const endIso = s <= e ? e : s;

  await ensureDatabase();

  // Export non-cancelled collection orders in the collection_date window
  let rows: Array<{
    id: number;
    public_id: string;
    customer_name: string;
    phone: string;
    email: string | null;
    collection_date: string;
    collection_time: string;
    subtotal_pence: number;
    item_count: number;
    status: string;
    created_at: string;
  }> = [];

  try {
    const result = await pool.query(
      `select id, public_id, customer_name, phone, email, collection_date, collection_time, subtotal_pence, item_count, status, created_at
       from orders
       where collection_date >= $1 and collection_date <= $2
         and status <> 'cancelled'
       order by collection_date asc, collection_time asc, id asc`,
      [startIso, endIso],
    );
    rows = result.rows as typeof rows;
  } catch (e) {
    console.error("[accounting] query failed", e);
    return Response.json({ error: "Could not load orders for export." }, { status: 500 });
  }

  const orders = rows.map((r) => ({
    id: r.id,
    number: r.id, // keep simple; orders.number is derived from id elsewhere but id is stable
    publicId: r.public_id,
    customerName: r.customer_name,
    phone: r.phone || "",
    email: r.email,
    collectionDate: r.collection_date,
    collectionTime: r.collection_time,
    subtotalPence: Number(r.subtotal_pence || 0),
    itemCount: Number(r.item_count || 0),
    status: r.status,
    createdAt: String(r.created_at),
  }));

  // Correct order numbers to match lib/format orderNumber (id offset? keep id for now but use same as display)
  // We'll map to Thai-{{id}} pattern which accountants expect; actual invoice no uses id.
  const grossPence = orders.reduce((s, o) => s + o.subtotalPence, 0);
  const { csv } = buildAccountingCSV(provider, orders);
  const notes = accountingNotes(provider, startIso, endIso, orders.length, grossPence);

  // Prepend notes as commented lines for Generic, but for provider-specific we ship notes in header comment?
  // We'll add notes as Excel-friendly text preamble for generic only; providers get clean file + notes in filename.
  const file = PROVIDERS[provider].file.replace(".csv", `-${startIso}-to-${endIso}.csv`);

  // For QuickBooks/Xero exact import must be clean; we return clean csv. Show notes on UI.
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
      "X-Accounting-Notes": encodeURIComponent(notes.join(" | ")),
    },
  });
}
