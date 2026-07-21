import { getSiteSettings } from "./site-settings-repository";
import { writePendingPhotoFile } from "./photo-storage";
import { prisma } from "./prisma-client";

export class PhotoUserDailyLimitError extends Error {}
export class PhotoSiteDailyLimitError extends Error {}
export class PoiNotFoundError extends Error {}

export async function createPendingPhotoUpload(
  userId: string,
  poiId: string,
  compressedBuffer: Buffer
): Promise<{ id: string }> {
  const poi = await prisma.poi.findUnique({ where: { id: poiId }, select: { name: true } });
  if (!poi) {
    throw new PoiNotFoundError();
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [settings, userCount, siteCount] = await Promise.all([
    getSiteSettings(),
    prisma.photo.count({ where: { uploadedByUserId: userId, createdAt: { gte: startOfDay } } }),
    prisma.photo.count({ where: { uploadedByUserId: { not: null }, createdAt: { gte: startOfDay } } })
  ]);

  if (userCount >= settings.maxPhotoUploadsPerUserPerDay) {
    throw new PhotoUserDailyLimitError();
  }
  if (siteCount >= settings.maxPhotoUploadsSiteWidePerDay) {
    throw new PhotoSiteDailyLimitError();
  }

  const { storagePath } = await writePendingPhotoFile(compressedBuffer);
  const row = await prisma.photo.create({
    data: {
      poiId,
      url: "",
      alt: poi.name,
      position: 0,
      status: "pending",
      uploadedByUserId: userId,
      storagePath
    }
  });

  return { id: row.id };
}
