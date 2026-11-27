import { adminGuard } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Accepts caption (+ optional image as data URL) and publishes to Facebook Page.
// If your Page has "Auto-share to Instagram" toggled on in Meta Business Suite,
// image posts will also appear on Instagram automatically.
export async function POST(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const body = await req.json().catch(() => null) as { caption?: string; imageData?: string | null } | null;
  const caption = typeof body?.caption === "string" ? body.caption.trim() : "";
  const imageData = typeof body?.imageData === "string" && body.imageData.startsWith("data:image/") ? body.imageData : null;

  if (!caption) return Response.json({ error: "Caption is required." }, { status: 400 });
  if (caption.length > 5000) return Response.json({ error: "Caption is too long (5000 char limit)." }, { status: 400 });
  if (imageData && imageData.length > 5_000_000) return Response.json({ error: "Image is too large. Use an image under ~4 MB." }, { status: 400 });

  const pageId = (process.env.FACEBOOK_PAGE_ID || process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID || "ThaiCourtyardMolesey").trim();
  const token = (process.env.FACEBOOK_PAGE_TOKEN || "").trim();
  if (!token) {
    return Response.json(
      { error: "Facebook Page token is not configured. Add FACEBOOK_PAGE_TOKEN (and FACEBOOK_PAGE_ID) in Vercel → Settings → Environment Variables, then redeploy. Paste your Page Access Token from Graph API Explorer → User or Page = your Page." },
      { status: 500 }
    );
  }
  // Strip surrounding quotes if pasted with them
  const cleanToken = token.replace(/^['\"]|['\"]$/g, "");

  const api = "https://graph.facebook.com/v21.0";

  try {
    // If we have an image, publish as a photo post (required for Instagram cross-post)
    if (imageData) {
      // Convert data URL to blob for multipart upload
      const match = imageData.match(/^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/);
      if (!match) return Response.json({ error: "Invalid image data URL. Use PNG, JPEG or WebP." }, { status: 400 });
      const mime = match[1].replace("jpg", "jpeg");
      const b64 = match[3];
      const buffer = Buffer.from(b64, "base64");

      const form = new FormData();
      // Facebook expects the image as multipart field "source"
      form.append("caption", caption);
      form.append("access_token", cleanToken);
      const blob = new Blob([buffer], { type: mime });
      // Use a sensible filename
      const ext = mime.split("/")[1] || "jpg";
      form.append("source", blob, `upload.${ext}`);

      const res = await fetch(`${api}/${encodeURIComponent(pageId)}/photos`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({})) as { id?: string; post_id?: string; error?: { message?: string; error_user_title?: string; error_user_msg?: string } };
      if (!res.ok || (!data.id && !data.post_id)) {
        const msg = data.error?.error_user_msg || data.error?.message || `Facebook error ${res.status}`;
        // Common: token is User token not Page token
        const hint = /access token|permission|manage_pages|publish/i.test(msg) ? " — Tip: In Graph API Explorer you must select User or Page = your *Page* (ThaiCourtyardMolesey) not your personal profile, to get a Page token (starts EAA... but longer)." : "";
        return Response.json({ error: msg + hint }, { status: 400 });
      }
      return Response.json({ ok: true, id: data.post_id || data.id, via: "photo" });
    }

    // Text-only post to /feed
    const params = new URLSearchParams();
    params.set("message", caption);
    params.set("access_token", cleanToken);
    const res = await fetch(`${api}/${encodeURIComponent(pageId)}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json().catch(() => ({})) as { id?: string; error?: { message?: string; error_user_msg?: string } };
    if (!res.ok || !data.id) {
      const msg = data.error?.error_user_msg || data.error?.message || `Facebook error ${res.status}`;
      const hint = /access token|permission/i.test(msg) ? " — Ensure FACEBOOK_PAGE_TOKEN is a *Page* token (Graph API Explorer → User or Page = ThaiCourtyardMolesey) with pages_manage_posts." : "";
      return Response.json({ error: msg + hint }, { status: 400 });
    }
    return Response.json({ ok: true, id: data.id, via: "feed", note: "Text-only posts won't auto-share to Instagram — add a photo for IG cross-post." });
  } catch (e) {
    console.error("[social/publish] failed", e);
    return Response.json({ error: e instanceof Error ? e.message : "Could not publish to Facebook. Please try again." }, { status: 500 });
  }
}
