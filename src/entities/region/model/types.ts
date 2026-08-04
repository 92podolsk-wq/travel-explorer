import type { Coordinates } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";

export type PublishStatus = "draft" | "published";

export type Region = {
  id: string;
  name: string;
  areaId: string;
  center: Coordinates;
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  timezoneOffsetHours: number;
  nameByLanguage: Record<Language, string>;
  sealCharacter: string;
  status: PublishStatus;
};

export type RegionInput = Omit<Region, "id"> & { id?: string };
