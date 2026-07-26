import type { Language } from "@/shared/i18n/types";
import type { Category, CategoryInput } from "@/entities/category/model/types";
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
  const base = slugify(name) || "category";
  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

type CategoryRow = Awaited<ReturnType<typeof prisma.category.findFirstOrThrow>>;

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    position: row.position,
    name: row.name,
    nameByLanguage: row.nameByLanguage as Record<Language, string>,
    icon: row.icon,
    color: row.color,
    isHidden: row.isHidden
  };
}

export async function readCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { position: "asc" } });
  return rows.map(toCategory);
}

function toCategoryData(input: CategoryInput) {
  return {
    name: input.name,
    nameByLanguage: input.nameByLanguage,
    icon: input.icon,
    color: input.color,
    isHidden: input.isHidden
  };
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const existingIds = new Set((await prisma.category.findMany({ select: { id: true } })).map((row) => row.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);
  const maxPosition = await prisma.category.aggregate({ _max: { position: true } });
  const position = (maxPosition._max.position ?? -1) + 1;

  const row = await prisma.category.create({ data: { id, position, ...toCategoryData(input) } });
  return toCategory(row);
}

export type CategoryMutationResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; placeCount: number };

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryMutationResult & { category?: Category }> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const isRename = input.name !== existing.name;
  if (isRename) {
    const placeCount = await prisma.poi.count({ where: { category: id } });
    if (placeCount > 0) {
      return { success: false, reason: "in-use", placeCount };
    }
  }

  const row = await prisma.category.update({ where: { id }, data: toCategoryData(input) });
  return { success: true, category: toCategory(row) };
}

export async function deleteCategory(id: string): Promise<CategoryMutationResult> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, reason: "not-found" };
  }

  const placeCount = await prisma.poi.count({ where: { category: id } });
  if (placeCount > 0) {
    return { success: false, reason: "in-use", placeCount };
  }

  await prisma.category.delete({ where: { id } });
  return { success: true };
}
