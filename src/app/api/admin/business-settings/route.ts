import { adminGuard } from "@/lib/auth";
import { businessSettingsSchema, saveBusinessSettings } from "@/lib/business/settings-store";
import { firstError, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = businessSettingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  try {
    const settings = await saveBusinessSettings({
      ...parsed.data,
      announcement: parsed.data.announcement.trim(),
    });
    return Response.json({ settings });
  } catch (error) {
    console.error("[business] save settings", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not save restaurant settings" }, { status: 500 });
  }
}
