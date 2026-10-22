import { adminGuard } from "@/lib/auth";
import { getReport } from "@/lib/business/analytics";
import { buildCsv } from "@/lib/business/csv";
import { clampPeriod } from "@/lib/business/dates";
import { buildPdf } from "@/lib/business/pdf";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ kind: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { kind } = await context.params;
  if (kind !== "sales" && kind !== "bookings" && kind !== "customers") {
    return Response.json({ error: "Unknown report" }, { status: 404 });
  }
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const { month, year } = clampPeriod(url.searchParams.get("year"), url.searchParams.get("month"));
  const report = await getReport(kind, month, year);
  if (!report) return Response.json({ error: "Could not build that report" }, { status: 500 });

  if (format === "pdf") {
    const lines = [
      ...report.notes,
      "",
      report.columns.join(" | "),
      ...report.rows.map((row) => row.join(" | ")),
    ];
    const body = buildPdf(report.title, lines);
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.filename}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = buildCsv(report.notes, report.columns, report.rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.filename}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
