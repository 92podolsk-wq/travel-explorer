import { kyotoRegion } from "./kyoto";
import { osakaRegion } from "./osaka";
import type { Region } from "./types";

export const seedRegions: Region[] = [kyotoRegion, osakaRegion];

export const defaultRegion = kyotoRegion;

export function findRegionById(regions: Region[], id: string): Region {
  return regions.find((region) => region.id === id) ?? regions[0] ?? defaultRegion;
}
