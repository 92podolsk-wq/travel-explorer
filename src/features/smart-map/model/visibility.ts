import type { Poi } from "@/entities/poi/model/types";
import type { ExplorationMode } from "@/features/exploration-mode/model/types";

export const zoomedInOnlyThreshold = 12;

const zoomThreshold = (zoom: number) => {
  if (zoom < 10) {
    return 92;
  }

  if (zoom < 13) {
    return 76;
  }

  return 0;
};

export function getVisiblePois(
  pois: Poi[],
  mode: ExplorationMode,
  zoom: number,
  query: string,
  getSearchText: (poi: Poi) => string = () => ""
) {
  const normalizedQuery = query.trim().toLowerCase();
  const threshold = zoomThreshold(zoom);

  return pois
    .map((poi) => ({
      poi,
      score: mode.score(poi)
    }))
    .filter(({ poi, score }) => {
      const matchesMode = poi.tags.some((tag) => mode.tags.includes(tag));
      const matchesSearch =
        normalizedQuery.length === 0 ||
        poi.name.toLowerCase().includes(normalizedQuery) ||
        poi.categories.some((category) => category.includes(normalizedQuery)) ||
        poi.tags.some((tag) => tag.includes(normalizedQuery)) ||
        getSearchText(poi).includes(normalizedQuery);

      const visibleAtZoom = poi.visibilityMode !== "zoomed-in" || zoom > zoomedInOnlyThreshold;

      return visibleAtZoom && matchesSearch && (score >= threshold || poi.mustVisit || matchesMode);
    })
    .sort((a, b) => b.score - a.score)
    .map(({ poi }) => poi);
}
