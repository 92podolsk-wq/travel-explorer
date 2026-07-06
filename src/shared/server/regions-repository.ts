import fs from "fs";
import path from "path";
import type { Region, RegionInput } from "@/entities/region/model/types";
import { readPois } from "./pois-repository";

const dataFilePath = path.join(process.cwd(), "data", "regions.json");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readRegions(): Region[] {
  const raw = fs.readFileSync(dataFilePath, "utf-8");
  return JSON.parse(raw) as Region[];
}

function writeRegions(regions: Region[]) {
  fs.writeFileSync(dataFilePath, `${JSON.stringify(regions, null, 2)}\n`, "utf-8");
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

export function createRegion(input: RegionInput): Region {
  const regions = readRegions();
  const existingIds = new Set(regions.map((region) => region.id));
  const id = input.id && !existingIds.has(input.id) ? input.id : generateUniqueId(input.name, existingIds);

  const region: Region = { ...input, id };
  regions.push(region);
  writeRegions(regions);

  return region;
}

export function updateRegion(id: string, input: RegionInput): Region | null {
  const regions = readRegions();
  const index = regions.findIndex((region) => region.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Region = { ...input, id };
  regions[index] = updated;
  writeRegions(regions);

  return updated;
}

export type DeleteRegionResult =
  | { success: true }
  | { success: false; reason: "not-found" }
  | { success: false; reason: "in-use"; placeCount: number };

export function deleteRegion(id: string): DeleteRegionResult {
  const regions = readRegions();
  const next = regions.filter((region) => region.id !== id);

  if (next.length === regions.length) {
    return { success: false, reason: "not-found" };
  }

  const placeCount = readPois().filter((poi) => poi.regionId === id).length;
  if (placeCount > 0) {
    return { success: false, reason: "in-use", placeCount };
  }

  writeRegions(next);
  return { success: true };
}
