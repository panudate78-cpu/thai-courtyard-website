import { adminGuard } from "@/lib/auth";
import { clearDemoData, getDemoStatus, resetDemoData } from "@/lib/demo";
import { readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;
  return Response.json({ status: await getDemoStatus() });
}

export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const body = (await readJson(req)) as { action?: string } | null;
  try {
    if (body?.action === "reset") return Response.json({ status: await resetDemoData() });
    if (body?.action === "clear") return Response.json({ status: await clearDemoData() });
    return Response.json({ error: "Unknown demo action" }, { status: 400 });
  } catch (error) {
    console.error("[demo] action failed", error);
    return Response.json({ error: "Demo data action failed. Please try again." }, { status: 500 });
  }
}
