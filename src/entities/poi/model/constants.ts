import type { Difficulty, PoiMainCategory, PoiTag, Season } from "./types";

export const poiMainCategories: PoiMainCategory[] = [
  "nature",
  "temples",
  "castles",
  "museums",
  "urban",
  "viewpoints",
  "entertainment",
  "gardens",
  "monuments",
  "unique"
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

export const seasons: Season[] = ["spring", "summer", "autumn", "winter"];
