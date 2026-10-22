import { adminGuard } from "@/lib/auth";
import { saveSeoOverrides, seoSaveSchema } from "@/lib/business/seo";
import { firstError, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const parsed = seoSaveSchema.safeParse(await readJson(req));
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });
  try {
    const seo = await saveSeoOverrides(parsed.data.pages);
    return Response.json({ seo });
  } catch (error) {
    console.error("[business] save seo", error);
    return Response.json({ error: error instanceof Error ? error.message : "Could not save SEO overrides" }, { status: 500 });
  }
}
