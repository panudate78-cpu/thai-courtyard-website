import { NextResponse, type NextRequest } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

function tokenOk(req: NextRequest): boolean {
  const env = process.env.SETUP_TOKEN;
  if (!env) return true;
  const h = req.headers.get("x-setup-token") || "";
  const q = req.nextUrl.searchParams.get("token") || "";
  return h === env || q === env;
}

export async function POST(req: NextRequest) {
  if (!tokenOk(req)) return NextResponse.json({ error: "Invalid setup token" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not set — create a Vercel Blob store (Vercel Dashboard → Storage → Blob) and add its token to .env + Vercel env. File uploads are blocked until this is set." },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file — send multipart with field 'file'" }, { status: 400 });
    if (file.size > 8_000_000) return NextResponse.json({ error: "File too large — max 8 MB" }, { status: 413 });
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (file.type && !allowed.includes(file.type)) return NextResponse.json({ error: `Unsupported image type ${file.type}` }, { status: 415 });

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `setup/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(key, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[blob/upload]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
