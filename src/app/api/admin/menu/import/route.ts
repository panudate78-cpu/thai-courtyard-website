import { db } from "@/db";
import { appendMenu, replaceMenu } from "@/db/bootstrap";
import { menuImports } from "@/db/schema";
import { adminGuard, isAdmin } from "@/lib/auth";
import { MENU_CSV_TEMPLATE, draftToSeed, importPublishSchema, parseMenuFile } from "@/lib/menu-import";
import { getRestaurantProfile } from "@/lib/restaurant";
import { firstError, readJson } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Downloadable CSV template: GET /api/admin/menu/import?template=1 */
export async function GET(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  const url = new URL(req.url);
  if (url.searchParams.get("template")) {
    return new Response(`\uFEFF${MENU_CSV_TEMPLATE}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="menu-template.csv"',
      },
    });
  }
  return Response.json({ error: "Use POST to parse or publish a menu import." }, { status: 405 });
}

/**
 * POST (multipart, field "file") → parse to a reviewable draft. Nothing is published.
 * POST (JSON {action:"publish", ...draft}) → publish after admin review.
 * During first-run setup (before launch) parsing is also allowed without a
 * session so the Setup Wizard's import step works; publishing always
 * requires an admin session or goes through /api/setup on launch.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const profile = await getRestaurantProfile().catch(() => null);
    const allowed = (await isAdmin()) || !profile?.setupCompleted;
    if (!allowed) return Response.json({ error: "Please sign in again." }, { status: 401 });
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Choose a menu file to upload." }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return Response.json({ error: "That file is too large (max 8 MB)." }, { status: 413 });
    try {
      const draft = await parseMenuFile(file);
      return Response.json({ draft });
    } catch (error) {
      console.error("[menu-import] parse failed", error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Could not read that file. Try the CSV template instead." },
        { status: 422 },
      );
    }
  }

  const denied = await adminGuard();
  if (denied) return denied;
  const body = (await readJson(req)) as { action?: string } | null;
  if (body?.action !== "publish") return Response.json({ error: "Unknown action" }, { status: 400 });
  const parsed = importPublishSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: firstError(parsed.error) }, { status: 400 });

  const seed = draftToSeed(parsed.data);
  if (!seed.length) return Response.json({ error: "There are no items to publish. Add at least one dish." }, { status: 400 });

  try {
    if (parsed.data.mode === "replace") await replaceMenu(seed);
    else await appendMenu(seed);
    const itemCount = seed.reduce((n, c) => n + c.items.length, 0);
    await db.insert(menuImports).values({
      filename: parsed.data.filename || "menu-import",
      sourceType: parsed.data.sourceType,
      status: "published",
      categoryCount: seed.length,
      itemCount,
      payload: { mode: parsed.data.mode, categories: seed.map((c) => c.name) },
    });
    return Response.json({ ok: true, categories: seed.length, items: itemCount });
  } catch (error) {
    console.error("[menu-import] publish failed", error);
    return Response.json({ error: "Could not publish the imported menu. Please try again." }, { status: 500 });
  }
}
