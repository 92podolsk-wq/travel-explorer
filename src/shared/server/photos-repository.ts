import type { AdminPhoto, PhotoStatus } from "@/entities/photo/model/types";
import type { Season } from "@/entities/poi/model/types";
import { deletePendingPhotoFile, deletePublicPhotoFile, movePendingPhotoToPublic } from "./photo-storage";
import { prisma } from "./prisma-client";

export class PhotoNotPendingError extends Error {}

export async function readAllPhotosWithPoi(): Promise<AdminPhoto[]> {
  const rows = await prisma.photo.findMany({
    include: { poi: { select: { name: true, regionId: true } }, uploadedBy: { select: { email: true, name: true } } },
    orderBy: [{ poiId: "asc" }, { position: "asc" }]
  });

  return rows.map((row) => ({
    id: row.id,
    poiId: row.poiId,
    poiName: row.poi.name,
    regionId: row.poi.regionId,
    url: row.url,
    alt: row.alt,
    author: row.author,
    season: row.season as Season | null,
    position: row.position,
    status: row.status as PhotoStatus,
    uploadedByUserId: row.uploadedByUserId,
    uploadedByEmail: row.uploadedBy?.email ?? null,
    uploadedByName: row.uploadedBy?.name ?? null,
    createdAt: row.createdAt.toISOString()
  }));
}

export async function updatePhoto(
  id: string,
  patch: { alt?: string; author?: string | null; season?: Season | null }
): Promise<boolean> {
  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  await prisma.photo.update({
    where: { id },
    data: {
      ...(patch.alt !== undefined ? { alt: patch.alt } : {}),
      ...(patch.author !== undefined ? { author: patch.author } : {}),
      ...(patch.season !== undefined ? { season: patch.season } : {})
    }
  });

  return true;
}

export async function deletePhoto(id: string): Promise<boolean> {
  const existing = await prisma.photo.findUnique({
    where: { id },
    select: { uploadedByUserId: true, status: true, storagePath: true, url: true }
  });
  if (!existing) {
    return false;
  }

  if (existing.uploadedByUserId) {
    if (existing.status === "pending" && existing.storagePath) {
      await deletePendingPhotoFile(existing.storagePath);
    } else if (existing.status === "approved") {
      await deletePublicPhotoFile(existing.url);
    }
  }

  await prisma.photo.delete({ where: { id } });
  return true;
}

export async function approvePhoto(id: string): Promise<boolean | null> {
  const existing = await prisma.photo.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }
  if (existing.status !== "pending" || !existing.storagePath) {
    throw new PhotoNotPendingError();
  }

  const maxPosition = await prisma.photo.aggregate({
    where: { poiId: existing.poiId, status: "approved" },
    _max: { position: true }
  });

  const url = await movePendingPhotoToPublic(existing.storagePath, existing.poiId);

  await prisma.photo.update({
    where: { id },
    data: {
      status: "approved",
      url,
      storagePath: null,
      position: (maxPosition._max.position ?? -1) + 1
    }
  });

  return true;
}

export async function reorderPhotos(poiId: string, orderedIds: string[]): Promise<boolean> {
  const photos = await prisma.photo.findMany({ where: { poiId } });
  const validIds = new Set(photos.map((photo) => photo.id));

  if (orderedIds.length !== photos.length || !orderedIds.every((id) => validIds.has(id))) {
    return false;
  }

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.photo.update({ where: { id }, data: { position: index } }))
  );

  return true;
}
