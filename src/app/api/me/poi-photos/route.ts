import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  PhotoSiteDailyLimitError,
  PhotoUserDailyLimitError,
  PoiNotFoundError,
  createPendingPhotoUpload
} from "@/shared/server/photo-uploads-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const poiId = formData.get("poiId");
  const file = formData.get("file");

  if (typeof poiId !== "string" || !poiId || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  let compressed: Buffer;
  try {
    const original = Buffer.from(await file.arrayBuffer());
    compressed = await sharp(original)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  try {
    await createPendingPhotoUpload(user.id, poiId, compressed);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof PhotoUserDailyLimitError) {
      const settings = await getSiteSettings();
      return NextResponse.json(
        { error: "USER_DAILY_LIMIT_REACHED", limit: settings.maxPhotoUploadsPerUserPerDay },
        { status: 400 }
      );
    }
    if (error instanceof PhotoSiteDailyLimitError) {
      return NextResponse.json({ error: "SITE_DAILY_LIMIT_REACHED" }, { status: 400 });
    }
    if (error instanceof PoiNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    throw error;
  }
}
