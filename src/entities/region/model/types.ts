import type { Coordinates } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";

export type Region = {
  id: string;
  name: string;
  country: string;
  area: string;
  center: Coordinates;
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  timezoneOffsetHours: number;
  nameByLanguage: Record<Language, string>;
  sealCharacter: string;
};

export type RegionInput = Omit<Region, "id"> & { id?: string };
