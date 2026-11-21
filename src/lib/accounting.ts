/**
 * Accounting CSV exports — one-click for QuickBooks / Xero / Sage / FreeAgent
 *
 * Sales-only: each non-cancelled collection order => one sales receipt / invoice line.
 * Amounts are stored gross (incl VAT). We export NET + VAT split at 20% standard rate
 * so accountants can map T1 / 20% VAT; non-VAT-registered businesses just remap tax code to No VAT.
 * All money handled in pence to avoid float errors.
 */

export type AccountingProvider = "quickbooks" | "xero" | "sage" | "freeagent" | "generic";

export const PROVIDERS: Record<AccountingProvider, { label: string; file: string; hint: string }> = {
  quickbooks: {
    label: "QuickBooks Online",
    file: "quickbooks-sales-receipts.csv",
    hint: "Import: QuickBooks → Gear → Import data → Sales Receipts → Browse. 1 row/order, Item = Collection Sales, Tax = 20%S (or No VAT).",
  },
  xero: {
    label: "Xero",
    file: "xero-sales-invoices.csv",
    hint: "Import: Xero → Business → Invoices → Import → comma-separated. AccountCode 200, TaxType 20% (VAT on Income) or No VAT.",
  },
  sage: {
    label: "Sage Business Cloud / Sage 50",
    file: "sage-sales-invoices.csv",
    hint: "Import: Sage → Sales → Import CSV → Type SI, Nominal 4000, Tax T1 (20%) or T9 (No VAT). Net + VAT = Gross.",
  },
  freeagent: {
    label: "FreeAgent",
    file: "freeagent-sales-invoices.csv",
    hint: "Import: FreeAgent → Invoices → Import Invoices. Price = NET, VAT 20% — FreeAgent adds VAT to get gross.",
  },
  generic: {
    label: "Generic CSV (any software)",
    file: "sales-export.csv",
    hint: "Universal: Date, Order No, Customer, Net, VAT, Gross — works with Excel, Wave, Zoho, KashFlow.",
  },
};

function cell(value: string) {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

function toCSV(columns: string[], rows: string[][]): string {
  const lines = [columns.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

function ddMMyyyy(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function moneyPence(pence: number): string {
  return (pence / 100).toFixed(2);
}

function splitVAT(grossPence: number) {
  // gross inc 20% → net = gross/1.2, vat = gross-net. Rounded to penny.
  const netPence = Math.round(grossPence / 1.2);
  const vatPence = grossPence - netPence;
  return { netPence, vatPence, grossPence };
}

function sanitizeAccountRef(phone: string, name: string): string {
  const digits = (phone || "").replace(/\D/g, "").slice(-10);
  if (digits) return `CUST${digits}`;
  const base = (name || "CASH").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "CASH";
  return base;
}

function orderDescription(o: ExportOrder): string {
  const n = o.itemCount;
  return `Collection Order #${o.number} — ${n} item${n === 1 ? "" : "s"} — ${o.collectionDate} ${o.collectionTime}`;
}

export type ExportOrder = {
  id: number;
  number: number;
  publicId: string;
  customerName: string;
  phone: string;
  email: string | null;
  collectionDate: string;
  collectionTime: string;
  subtotalPence: number;
  itemCount: number;
  status: string;
  createdAt: string;
};

// ── Providers ──

function quickbooksRows(orders: ExportOrder[]): { columns: string[]; rows: string[][] } {
  const columns = ["Date", "Customer", "Sales Receipt No", "Item", "Description", "Qty", "Rate", "Amount", "Tax Code", "Memo"];
  const rows = orders.map((o) => {
    const { netPence: _n, vatPence: _v, grossPence } = splitVAT(o.subtotalPence);
    // QuickBooks Amount is gross; Tax Code column tells rate. Use 20.0% S for VAT.
    return [
      ddMMyyyy(o.collectionDate),
      o.customerName || "Walk-in Customer",
      `THAI-${o.number}`,
      "Collection Sales : Food",
      orderDescription(o),
      "1",
      moneyPence(grossPence),
      moneyPence(grossPence),
      "20.0% S", // change to \"No VAT\" or \"Exempt\" if not VAT-registered — accountant can bulk edit
      o.publicId,
    ];
  });
  return { columns, rows };
}

function xeroRows(orders: ExportOrder[]): { columns: string[]; rows: string[][] } {
  const columns = [
    "ContactName",
    "InvoiceNumber",
    "InvoiceDate",
    "DueDate",
    "Description",
    "Quantity",
    "UnitAmount",
    "AccountCode",
    "TaxType",
    "Currency",
  ];
  const rows = orders.map((o) => {
    const { netPence } = splitVAT(o.subtotalPence);
    return [
      o.customerName || "Walk-in Customer",
      `THAI-${o.number}`,
      ddMMyyyy(o.collectionDate),
      ddMMyyyy(o.collectionDate), // collected → due immediately
      orderDescription(o),
      "1",
      moneyPence(netPence), // Xero UnitAmount is ex-VAT; TaxType adds 20%
      "200", // Sales
      "20% (VAT on Income)", // or \"No VAT\" if not VAT-registered
      "GBP",
    ];
  });
  return { columns, rows };
}

function sageRows(orders: ExportOrder[]): { columns: string[]; rows: string[][] } {
  const columns = [
    "Type",
    "Account Reference",
    "Customer Name",
    "Nominal Code",
    "Date",
    "Reference",
    "Details",
    "Net Amount",
    "Tax Code",
    "Tax Amount",
    "Gross Amount",
    "Currency",
  ];
  const rows = orders.map((o) => {
    const { netPence, vatPence, grossPence } = splitVAT(o.subtotalPence);
    return [
      "SI",
      sanitizeAccountRef(o.phone, o.customerName),
      o.customerName || "Walk-in Customer",
      "4000",
      ddMMyyyy(o.collectionDate),
      `THAI-${o.number}`,
      orderDescription(o),
      moneyPence(netPence),
      "T1", // T1=20% Std, use T9 for No VAT
      moneyPence(vatPence),
      moneyPence(grossPence),
      "GBP",
    ];
  });
  return { columns, rows };
}

function freeagentRows(orders: ExportOrder[]): { columns: string[]; rows: string[][] } {
  const columns = [
    "Contact Name",
    "Reference",
    "Dated On",
    "Due Date",
    "Currency",
    "Description",
    "Price",
    "Quantity",
    "VAT Rate (%)",
    "Category",
    "Payment Terms",
  ];
  const rows = orders.map((o) => {
    const { netPence } = splitVAT(o.subtotalPence);
    return [
      o.customerName || "Walk-in Customer",
      `THAI-${o.number}`,
      o.collectionDate, // YYYY-MM-DD
      o.collectionDate,
      "GBP",
      orderDescription(o),
      moneyPence(netPence), // FreeAgent Price is ex-VAT
      "1",
      "20", // VAT rate percent
      "Sales",
      "On Collection",
    ];
  });
  return { columns, rows };
}

function genericRows(orders: ExportOrder[]): { columns: string[]; rows: string[][] } {
  const columns = [
    "Date",
    "Order Number",
    "Public ID",
    "Customer Name",
    "Email",
    "Phone",
    "Collection Date",
    "Collection Time",
    "Items",
    "Net (£)",
    "VAT 20% (£)",
    "Gross (£)",
    "Status",
    "Description",
  ];
  const rows = orders.map((o) => {
    const { netPence, vatPence, grossPence } = splitVAT(o.subtotalPence);
    return [
      ddMMyyyy(o.collectionDate),
      `THAI-${o.number}`,
      o.publicId,
      o.customerName || "",
      o.email || "",
      o.phone || "",
      o.collectionDate,
      o.collectionTime,
      String(o.itemCount),
      moneyPence(netPence),
      moneyPence(vatPence),
      moneyPence(grossPence),
      o.status,
      orderDescription(o),
    ];
  });
  return { columns, rows };
}

export function buildAccountingCSV(provider: AccountingProvider, orders: ExportOrder[]): { csv: string; columns: string[]; rows: string[][]; filename: string } {
  let built: { columns: string[]; rows: string[][] };
  switch (provider) {
    case "quickbooks":
      built = quickbooksRows(orders);
      break;
    case "xero":
      built = xeroRows(orders);
      break;
    case "sage":
      built = sageRows(orders);
      break;
    case "freeagent":
      built = freeagentRows(orders);
      break;
    default:
      built = genericRows(orders);
      break;
  }
  const filename = PROVIDERS[provider]?.file || PROVIDERS.generic.file;
  const csv = toCSV(built.columns, built.rows);
  return { csv, ...built, filename };
}

export function accountingNotes(provider: AccountingProvider, start: string, end: string, count: number, grossPence: number): string[] {
  const { netPence, vatPence } = splitVAT(grossPence);
  return [
    `${PROVIDERS[provider].label} • ${start} to ${end} • ${count} order${count === 1 ? "" : "s"} • Gross ${moneyPence(grossPence)} (Net ${moneyPence(netPence)} + VAT ${moneyPence(vatPence)} at 20% incl)`,
    PROVIDERS[provider].hint,
    `If not VAT-registered change Tax Code to No VAT / T9 / 0% and use Gross as Net. Amounts are sales-only, Excl delivery fees. Cancelled orders excluded.`,
  ];
}
