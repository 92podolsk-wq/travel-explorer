import type { Difficulty, PoiCategory, PoiTag } from "./types";

export const poiCategories: PoiCategory[] = [
  "temple",
  "shrine",
  "garden",
  "street",
  "district",
  "nature",
  "viewpoint",
  "market",
  "museum"
];

export const poiTags: PoiTag[] = [
  "must-visit",
  "photographer",
  "first-visit",
  "nature",
  "autumn",
  "sakura",
  "hidden-gem",
  "sunrise",
  "night",
  "rain",
  "public-transport",
  "light-trekking"
];

export const poiDifficulties: Difficulty[] = ["easy", "moderate", "active"];
