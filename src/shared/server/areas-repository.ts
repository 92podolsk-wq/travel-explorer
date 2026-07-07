import type { Language } from "@/shared/i18n/types";
import type { Area, AreaInput } from "@/entities/area/model/types";
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
  const base = slugify(name) || "area";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

type AreaRow = Awaited<ReturnType<typeof prisma.area.findFirstOrThrow>>;

function toArea(row: AreaRow): Area {
  return {
    id: row.id,
    countryId: row.countryId,
    name: row.name,
    nameByLanguage: row.nameByLanguage as Record<Language, string>
  };
}

export async function readAreas(): Promise<Area[]> {
  const rows = await prisma.area.findMany();
  return rows.map(toArea);
}

export async function createArea(input: AreaInput): Promise<Area> {
  const existingIds = new Set((await prisma.area.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const row = await prisma.area.create({
    data: { id, countryId: input.countryId, name: input.name, nameByLanguage: input.nameByLanguage }
  });
  return toArea(row);
}

export async function updateArea(id: string, input: AreaInput): Promise<Area | null> {
  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.area.update({
    where: { id },
    data: { countryId: input.countryId, name: input.name, nameByLanguage: input.nameByLanguage }
  });
  return toArea(row);
}

export type DeleteAreaResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; cityCount: number };

export async function deleteArea(id: string): Promise<DeleteAreaResult> {
  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const cityCount = await prisma.region.count({ where: { areaId: id } });
  if (cityCount > 0) {
    return { success: false, reason: "in-use", cityCount };
  }

  await prisma.area.delete({ where: { id } });
  return { success: true };
}
