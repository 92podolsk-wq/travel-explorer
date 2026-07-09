import type { ExplorationMode, ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import type { PoiTag } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
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
  const base = slugify(name) || "mode";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

type ModeRow = Awaited<ReturnType<typeof prisma.explorationMode.findFirstOrThrow>>;

function toMode(row: ModeRow): ExplorationMode {
  return {
    id: row.id,
    position: row.position,
    name: row.name,
    nameByLanguage: row.nameByLanguage as Record<Language, string>,
    description: row.description,
    descriptionByLanguage: row.descriptionByLanguage as Record<Language, string>,
    tags: row.tags as PoiTag[],
    icon: row.icon
  };
}

export async function readExplorationModes(): Promise<ExplorationMode[]> {
  const rows = await prisma.explorationMode.findMany({ orderBy: { position: "asc" } });
  return rows.map(toMode);
}

function toModeData(input: ExplorationModeInput) {
  return {
    name: input.name,
    nameByLanguage: input.nameByLanguage,
    description: input.description,
    descriptionByLanguage: input.descriptionByLanguage,
    tags: input.tags,
    icon: input.icon
  };
}

export async function createExplorationMode(input: ExplorationModeInput): Promise<ExplorationMode> {
  const existingIds = new Set((await prisma.explorationMode.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const maxPosition = await prisma.explorationMode.aggregate({ _max: { position: true } });
  const position = (maxPosition._max.position ?? -1) + 1;

  const row = await prisma.explorationMode.create({ data: { id, position, ...toModeData(input) } });
  return toMode(row);
}

export async function updateExplorationMode(id: string, input: ExplorationModeInput): Promise<ExplorationMode | null> {
  const existing = await prisma.explorationMode.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  const row = await prisma.explorationMode.update({ where: { id }, data: toModeData(input) });
  return toMode(row);
}

export type DeleteExplorationModeResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "last-mode" };

export async function deleteExplorationMode(id: string): Promise<DeleteExplorationModeResult> {
  const existing = await prisma.explorationMode.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const total = await prisma.explorationMode.count();
  if (total <= 1) {
    return { success: false, reason: "last-mode" };
  }

  await prisma.explorationMode.delete({ where: { id } });
  return { success: true };
}
