import type { Language } from "@/shared/i18n/types";
import type { PublishStatus, Region, RegionInput } from "@/entities/region/model/types";
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
  const base = slugify(name) || "region";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

type RegionRow = Awaited<ReturnType<typeof prisma.region.findFirstOrThrow>>;

function toRegion(row: RegionRow): Region {
  return {
    id: row.id,
    name: row.name,
    areaId: row.areaId,
    center: { lat: row.centerLat, lng: row.centerLng },
    defaultZoom: row.defaultZoom,
    bounds: row.bounds as [[number, number], [number, number]],
    timezoneOffsetHours: row.timezoneOffsetHours,
    nameByLanguage: row.nameByLanguage as Record<Language, string>,
    sealCharacter: row.sealCharacter,
    status: row.status as PublishStatus
  };
}

export async function readRegions(): Promise<Region[]> {
  const rows = await prisma.region.findMany();
  return rows.map(toRegion);
}

export async function readPublishedRegions(): Promise<Region[]> {
  const rows = await prisma.region.findMany({ where: { status: "published" } });
  return rows.map(toRegion);
}

function toRegionData(input: RegionInput) {
  return {
    areaId: input.areaId,
    name: input.name,
    nameByLanguage: input.nameByLanguage,
    centerLat: input.center.lat,
    centerLng: input.center.lng,
    defaultZoom: input.defaultZoom,
    bounds: input.bounds,
    timezoneOffsetHours: input.timezoneOffsetHours,
    sealCharacter: input.sealCharacter,
    status: input.status
  };
}

export async function createRegion(input: RegionInput): Promise<Region> {
  const existingIds = new Set((await prisma.region.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const row = await prisma.region.create({ data: { id, ...toRegionData(input) } });
  return toRegion(row);
}

export async function updateRegion(id: string, input: RegionInput): Promise<Region | null> {
  const existing = await prisma.region.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.region.update({ where: { id }, data: toRegionData(input) });
  return toRegion(row);
}

export type DeleteRegionResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; placeCount: number };

export async function deleteRegion(id: string): Promise<DeleteRegionResult> {
  const existing = await prisma.region.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const placeCount = await prisma.poi.count({ where: { regionId: id } });
  if (placeCount > 0) {
    return { success: false, reason: "in-use", placeCount };
  }

  await prisma.region.delete({ where: { id } });
  return { success: true };
}
