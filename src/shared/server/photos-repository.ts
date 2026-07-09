import type { Season } from "@/entities/poi/model/types";
import { prisma } from "./prisma-client";

export type PhotoWithPoi = {
  id: string;
  poiId: string;
  poiName: string;
  regionId: string;
  url: string;
  alt: string;
  author: string | null;
  season: Season | null;
  position: number;
};

export async function readAllPhotosWithPoi(): Promise<PhotoWithPoi[]> {
  const rows = await prisma.photo.findMany({
    include: { poi: { select: { name: true, regionId: true } } },
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
    position: row.position
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
  try {
    await prisma.photo.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
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
