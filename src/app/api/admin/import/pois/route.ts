import { NextResponse } from "next/server";
import type { PoiInput } from "@/entities/poi/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createPoi, updatePoi } from "@/shared/server/pois-repository";
import { readRegions } from "@/shared/server/regions-repository";
import { readCategories } from "@/shared/server/categories-repository";
import { prisma } from "@/shared/server/prisma-client";

type ImportError = { index: number; name: string; error: string };

function listPreview(ids: string[], limit = 5) {
  const shown = ids.slice(0, limit).join(", ");
  return ids.length > limit ? `${shown}, …` : shown;
}

function validate(item: PoiInput, index: number, validRegionIds: Set<string>, validCategoryIds: Set<string>): ImportError | null {
  if (!item.regionId) return { index, name: item.name || "", error: "Не указан regionId." };
  if (!validRegionIds.has(item.regionId)) {
    return {
      index,
      name: item.name || "",
      error: `Город "${item.regionId}" не найден. Доступные: ${listPreview([...validRegionIds])}.`
    };
  }
  if (!item.name?.trim()) return { index, name: item.name || "", error: "Не указано название." };
  if (!item.description?.trim()) return { index, name: item.name, error: "Не указано описание." };
  if (!item.category) return { index, name: item.name, error: "Не указана категория." };
  if (!validCategoryIds.has(item.category)) {
    return {
      index,
      name: item.name,
      error: `Категория "${item.category}" не найдена. Доступные: ${listPreview([...validCategoryIds])}.`
    };
  }
  if (!item.photos || item.photos.length === 0) return { index, name: item.name, error: "Не указано ни одного фото." };
  if (typeof item.coordinates?.lat !== "number" || typeof item.coordinates?.lng !== "number") {
    return { index, name: item.name, error: "Некорректные координаты." };
  }
  return null;
}

type DryRunResult = { toCreate: number; toUpdate: number; errors: ImportError[] };
type CommitResult = { created: number; updated: number; errors: ImportError[] };

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items, dryRun } = (await request.json()) as { items?: PoiInput[]; dryRun?: boolean };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Список локаций пуст." }, { status: 400 });
  }

  const [regions, categories, existingRows] = await Promise.all([
    readRegions(),
    readCategories(),
    prisma.poi.findMany({ select: { id: true } })
  ]);
  const validRegionIds = new Set(regions.map((region) => region.id));
  const validCategoryIds = new Set(categories.map((category) => category.id));
  const existingIds = new Set(existingRows.map((row) => row.id));

  const errors: ImportError[] = [];
  let createdOrToCreate = 0;
  let updatedOrToUpdate = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const validationError = validate(item, index, validRegionIds, validCategoryIds);
    if (validationError) {
      errors.push(validationError);
      continue;
    }

    const isUpdate = Boolean(item.id && existingIds.has(item.id));

    if (dryRun) {
      if (isUpdate) updatedOrToUpdate += 1;
      else createdOrToCreate += 1;
      continue;
    }

    try {
      if (isUpdate && item.id) {
        await updatePoi(item.id, item);
        updatedOrToUpdate += 1;
      } else {
        await createPoi(item);
        createdOrToCreate += 1;
      }
    } catch {
      errors.push({ index, name: item.name, error: "Не удалось сохранить." });
    }
  }

  if (dryRun) {
    return NextResponse.json({ toCreate: createdOrToCreate, toUpdate: updatedOrToUpdate, errors } satisfies DryRunResult);
  }

  return NextResponse.json({ created: createdOrToCreate, updated: updatedOrToUpdate, errors } satisfies CommitResult);
}
