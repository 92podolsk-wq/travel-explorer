import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";

export function computeModeScore(poi: Poi, mode: Pick<ExplorationMode, "tags">): number {
  const tagMatches = poi.tags.filter((tag) => mode.tags.includes(tag)).length;
  return poi.photoScore * 0.5 + poi.importance * 0.5 + tagMatches * 12;
}
