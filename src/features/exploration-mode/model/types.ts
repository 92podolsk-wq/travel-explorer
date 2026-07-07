import type { Poi, PoiTag } from "@/entities/poi/model/types";

export type ExplorationModeId =
  | "photographer"
  | "first-visit"
  | "nature"
  | "autumn"
  | "sakura";

export type ExplorationMode = {
  id: ExplorationModeId;
  label: string;
  description: string;
  tags: PoiTag[];
  score: (poi: Poi) => number;
};
