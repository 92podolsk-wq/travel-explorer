import { NextResponse } from "next/server";
import sharp from "sharp";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { writePublicPhotoFile } from "@/shared/server/photo-storage";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "INVALID_URL" }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "Wayora/1.0 (+https://wayora.ru; admin photo import)" }
    });
  } catch {
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 400 });
  }

  if (!response.ok) {
    return NextResponse.json({ error: "FETCH_FAILED" }, { status: 400 });
  }

  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (!contentType || !ALLOWED_MIME_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  const original = Buffer.from(await response.arrayBuffer());
  if (original.byteLength > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  let compressed: Buffer;
  try {
    compressed = await sharp(original)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  const localUrl = await writePublicPhotoFile(compressed, "admin");
  return NextResponse.json({ url: localUrl }, { status: 201 });
}
