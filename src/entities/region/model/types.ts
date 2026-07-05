import type { Coordinates } from "@/entities/poi/model/types";

export type Region = {
  id: string;
  name: string;
  country: string;
  center: Coordinates;
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  timezoneOffsetHours: number;
};
