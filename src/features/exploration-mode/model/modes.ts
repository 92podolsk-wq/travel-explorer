import type { Poi } from "@/entities/poi/model/types";
import type { ExplorationMode } from "./types";

const tagBonus = (poi: Poi, tags: string[]) =>
  poi.tags.filter((tag) => tags.includes(tag)).length * 12;

export const explorationModes: ExplorationMode[] = [
  {
    id: "photographer",
    label: "Photographer",
    description: "Photo score, light, viewpoints, and atmosphere.",
    tags: ["photographer", "sunrise", "night", "rain"],
    score: (poi) => poi.photoScore + tagBonus(poi, ["sunrise", "night", "rain"])
  },
  {
    id: "first-visit",
    label: "First Visit",
    description: "Kyoto classics with strong planning value.",
    tags: ["first-visit", "must-visit", "public-transport"],
    score: (poi) => poi.importance + (poi.mustVisit ? 18 : 0)
  },
  {
    id: "nature",
    label: "Nature",
    description: "Gardens, rivers, mountains, and softer walking days.",
    tags: ["nature", "light-trekking", "rain"],
    score: (poi) => poi.photoScore + tagBonus(poi, ["nature", "light-trekking"])
  },
  {
    id: "autumn",
    label: "Autumn",
    description: "Color, texture, and seasonal depth.",
    tags: ["autumn", "photographer"],
    score: (poi) => poi.photoScore + tagBonus(poi, ["autumn"])
  },
  {
    id: "sakura",
    label: "Sakura",
    description: "Spring blossom anchors and canal walks.",
    tags: ["sakura", "photographer"],
    score: (poi) => poi.photoScore + tagBonus(poi, ["sakura"])
  }
];

export const defaultExplorationMode = explorationModes[0];
