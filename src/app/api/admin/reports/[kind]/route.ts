import { adminGuard } from "@/lib/auth";
import { buildCsv } from "@/lib/business/csv";
import { buildPdf } from "@/lib/business/pdf";
import { getLiveBusinessReport } from "@/lib/business/reports-live";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ kind: string }> }) {
  const denied = await adminGuard();
  if (denied) return denied;
  const { kind } = await context.params;
  if (kind !== "business") return Response.json({ error: "Unknown report" }, { status: 404 });
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  try {
    const report = await getLiveBusinessReport({
      range: url.searchParams.get("range") ?? undefined,
      start: url.searchParams.get("start") ?? undefined,
      end: url.searchParams.get("end") ?? undefined,
    });
    const columns = ["Month", "Enquiries", "Customers", "Bookings / jobs", "Completed jobs", "Revenue"];
    const rows = report.trends.map((row) => [row.month, String(row.enquiries), String(row.customers), String(row.jobs), String(row.completedJobs), `£${(row.revenuePence / 100).toFixed(2)}`]);
    const notes = [
      `Live database report: ${report.start} to ${report.end}`,
      `Total enquiries: ${report.enquiries}`,
      `Total customers: ${report.customers}`,
      `Total bookings / jobs: ${report.jobs}`,
      `Completed jobs: ${report.completedJobs}`,
      `Revenue: £${(report.revenuePence / 100).toFixed(2)}`,
      `Average job value: ${report.averageJobValuePence === null ? "No data available" : `£${(report.averageJobValuePence / 100).toFixed(2)}`}`,
      `Conversion rate: ${report.conversionRate === null ? "No data available" : `${report.conversionRate.toFixed(1)}%`}`,
    ];
    if (format === "pdf") {
      const body = buildPdf("Thai Courtyard business report", [...notes, "", columns.join(" | "), ...rows.map((row) => row.join(" | "))]);
      return new Response(new Uint8Array(body), {
        headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="thai-courtyard-business-report.pdf"`, "Cache-Control": "no-store" },
      });
    }
    return new Response(buildCsv(notes, columns, rows), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="thai-courtyard-business-report.csv"`, "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[reports] export query failed", error);
    return Response.json({ error: "Could not generate the live report." }, { status: 500 });
  }
}
