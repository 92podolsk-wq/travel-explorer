import fs from "fs";
import path from "path";
import type { Area, AreaInput } from "@/entities/area/model/types";
import { readRegions } from "./regions-repository";

const dataFilePath = path.join(process.cwd(), "data", "areas.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readAreas(): Area[] {
  const raw = fs.readFileSync(dataFilePath, "utf-8");
  return JSON.parse(raw) as Area[];
}

function writeAreas(areas: Area[]) {
  fs.writeFileSync(dataFilePath, `${JSON.stringify(areas, null, 2)}\n`, "utf-8");
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

export function createArea(input: AreaInput): Area {
  const areas = readAreas();
  const existingIds = new Set(areas.map((area) => area.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const area: Area = { ...input, id };
  areas.push(area);
  writeAreas(areas);

  return area;
}

export function updateArea(id: string, input: AreaInput): Area | null {
  const areas = readAreas();
  const index = areas.findIndex((area) => area.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Area = { ...input, id };
  areas[index] = updated;
  writeAreas(areas);

  return updated;
}

export type DeleteAreaResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; cityCount: number };

export function deleteArea(id: string): DeleteAreaResult {
  const areas = readAreas();
  const next = areas.filter((area) => area.id !== id);

  if (next.length === areas.length) {
    return { success: false, reason: "not-found" };
  }

  const cityCount = readRegions().filter((region) => region.areaId === id).length;
  if (cityCount > 0) {
    return { success: false, reason: "in-use", cityCount };
  }

  writeAreas(next);
  return { success: true };
}
