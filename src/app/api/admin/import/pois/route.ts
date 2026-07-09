import { NextResponse } from "next/server";
import type { PoiInput } from "@/entities/poi/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createPoi } from "@/shared/server/pois-repository";

type ImportError = { index: number; name: string; error: string };

function validate(item: PoiInput, index: number): ImportError | null {
  if (!item.regionId) return { index, name: item.name || "", error: "Не указан regionId." };
  if (!item.name?.trim()) return { index, name: item.name || "", error: "Не указано название." };
  if (!item.description?.trim()) return { index, name: item.name, error: "Не указано описание." };
  if (!item.categories || item.categories.length === 0) return { index, name: item.name, error: "Не указаны категории." };
  if (!item.photos || item.photos.length === 0) return { index, name: item.name, error: "Не указано ни одного фото." };
  if (typeof item.coordinates?.lat !== "number" || typeof item.coordinates?.lng !== "number") {
    return { index, name: item.name, error: "Некорректные координаты." };
  }
  return null;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items } = (await request.json()) as { items?: PoiInput[] };

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Список локаций пуст." }, { status: 400 });
  }

  const errors: ImportError[] = [];
  let created = 0;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const validationError = validate(item, index);
    if (validationError) {
      errors.push(validationError);
      continue;
    }

    try {
      await createPoi(item);
      created += 1;
    } catch {
      errors.push({ index, name: item.name, error: "Не удалось сохранить." });
    }
  }

  return NextResponse.json({ created, errors });
}
