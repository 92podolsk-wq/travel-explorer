import fs from "fs";
import path from "path";
import type { Poi, PoiInput } from "@/entities/poi/model/types";

const dataFilePath = path.join(process.cwd(), "data", "pois.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readPois(): Poi[] {
  const raw = fs.readFileSync(dataFilePath, "utf-8");
  return JSON.parse(raw) as Poi[];
}

function writePois(pois: Poi[]) {
  fs.writeFileSync(dataFilePath, `${JSON.stringify(pois, null, 2)}\n`, "utf-8");
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

export function createPoi(input: PoiInput): Poi {
  const pois = readPois();
  const existingIds = new Set(pois.map((poi) => poi.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const poi: Poi = { ...input, id };
  pois.push(poi);
  writePois(pois);

  return poi;
}

export function updatePoi(id: string, input: PoiInput): Poi | null {
  const pois = readPois();
  const index = pois.findIndex((poi) => poi.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Poi = { ...input, id };
  pois[index] = updated;
  writePois(pois);

  return updated;
}

export function deletePoi(id: string): boolean {
  const pois = readPois();
  const next = pois.filter((poi) => poi.id !== id);

  if (next.length === pois.length) {
    return false;
  }

  writePois(next);
  return true;
}
