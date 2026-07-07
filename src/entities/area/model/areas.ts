import { kansaiArea } from "./kansai";
import type { Area } from "./types";

export const seedAreas: Area[] = [kansaiArea];

export const defaultArea = kansaiArea;

export function findAreaById(areas: Area[], id: string): Area | undefined {
  return areas.find((area) => area.id === id);
}
