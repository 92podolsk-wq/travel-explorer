import type { Language } from "@/shared/i18n/types";
import type { PublishStatus } from "@/entities/region/model/types";
import type { Difficulty, Photo, Poi, PoiCategory, PoiInput, PoiTag, Season } from "@/entities/poi/model/types";
import { prisma } from "./prisma-client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateUniqueId(name: string, existingIds: Set<string>) {
  const base = slugify(name) || "place";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

export type PoiRow = Awaited<ReturnType<typeof prisma.poi.findFirstOrThrow<{ include: { photos: true } }>>>;

export function toPoi(row: PoiRow): Poi {
  return {
    id: row.id,
    regionId: row.regionId,
    name: row.name,
    nameByLanguage: row.nameByLanguage as Record<Language, string>,
    coordinates: { lat: row.lat, lng: row.lng },
    description: row.description,
    descriptionByLanguage: (row.descriptionByLanguage as Record<Language, string> | null) ?? {
      en: row.description,
      ru: row.description,
      ja: row.description
    },
    rating: row.rating,
    photos: [...row.photos]
      .sort((a, b) => a.position - b.position)
      .map(
        (photo): Photo => ({
          id: photo.id,
          url: photo.url,
          alt: photo.alt,
          ...(photo.author ? { author: photo.author } : {}),
          ...(photo.season ? { season: photo.season as Season } : {})
        })
      ),
    categories: row.categories as PoiCategory[],
    tags: row.tags as PoiTag[],
    seasons: row.seasons,
    photoScore: row.photoScore,
    mustVisit: row.mustVisit,
    bestTime: row.bestTime,
    difficulty: row.difficulty as Difficulty,
    durationMinutes: row.durationMinutes,
    importance: row.importance,
    status: row.status as PublishStatus
  };
}

export async function readPois(): Promise<Poi[]> {
  const rows = await prisma.poi.findMany({ include: { photos: true } });
  return rows.map(toPoi);
}

export async function readPublishedPois(): Promise<Poi[]> {
  const rows = await prisma.poi.findMany({ where: { status: "published" }, include: { photos: true } });
  return rows.map(toPoi);
}

async function writePoi(id: string, input: PoiInput) {
  await prisma.poi.upsert({
    where: { id },
    create: {
      id,
      regionId: input.regionId,
      name: input.name,
      nameByLanguage: input.nameByLanguage,
      lat: input.coordinates.lat,
      lng: input.coordinates.lng,
      description: input.description,
      descriptionByLanguage: input.descriptionByLanguage,
      rating: input.rating,
      categories: input.categories,
      tags: input.tags,
      seasons: input.seasons,
      photoScore: input.photoScore,
      mustVisit: input.mustVisit,
      bestTime: input.bestTime,
      difficulty: input.difficulty,
      durationMinutes: input.durationMinutes,
      importance: input.importance,
      status: input.status
    },
    update: {
      regionId: input.regionId,
      name: input.name,
      nameByLanguage: input.nameByLanguage,
      lat: input.coordinates.lat,
      lng: input.coordinates.lng,
      description: input.description,
      descriptionByLanguage: input.descriptionByLanguage,
      rating: input.rating,
      categories: input.categories,
      tags: input.tags,
      seasons: input.seasons,
      photoScore: input.photoScore,
      mustVisit: input.mustVisit,
      bestTime: input.bestTime,
      difficulty: input.difficulty,
      durationMinutes: input.durationMinutes,
      importance: input.importance,
      status: input.status
    }
  });

  await prisma.photo.deleteMany({ where: { poiId: id } });
  await prisma.photo.createMany({
    data: input.photos.map((photo, index) => ({
      id: photo.id,
      poiId: id,
      url: photo.url,
      alt: photo.alt,
      author: photo.author ?? null,
      season: photo.season ?? null,
      position: index
    }))
  });
}

export async function createPoi(input: PoiInput): Promise<Poi> {
  const existingIds = new Set((await prisma.poi.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  await writePoi(id, input);

  const row = await prisma.poi.findUniqueOrThrow({ where: { id }, include: { photos: true } });
  return toPoi(row);
}

export async function updatePoi(id: string, input: PoiInput): Promise<Poi | null> {
  const existing = await prisma.poi.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  await writePoi(id, input);

  const row = await prisma.poi.findUniqueOrThrow({ where: { id }, include: { photos: true } });
  return toPoi(row);
}

export async function deletePoi(id: string): Promise<boolean> {
  try {
    await prisma.poi.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
