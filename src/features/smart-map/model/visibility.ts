import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Coordinates, Poi } from "@/entities/poi/model/types";
import { computeModeScore } from "@/features/exploration-mode/model/score";
import { haversineDistanceMeters } from "@/shared/lib/geo";

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

type VisibilityOptions = {
  viewedPoiIds?: string[];
  hideViewed?: boolean;
  favoritePoiIds?: string[];
  hideFavorites?: boolean;
  visitedPoiIds?: string[];
  hideVisited?: boolean;
  nearbyOrigin?: Coordinates | null;
};

export function getVisiblePois(
  pois: Poi[],
  selectedModes: ExplorationMode[],
  zoom: number,
  query: string,
  getSearchText: (poi: Poi) => string = () => "",
  {
    viewedPoiIds = [],
    hideViewed = false,
    favoritePoiIds = [],
    hideFavorites = false,
    visitedPoiIds = [],
    hideVisited = false,
    nearbyOrigin = null
  }: VisibilityOptions = {}
) {
  const normalizedQuery = query.trim().toLowerCase();
  const threshold = zoomThreshold(zoom);
  const hasActiveFilter = selectedModes.length > 0;
  const selectedTags = new Set(selectedModes.flatMap((mode) => mode.tags));

  return pois
    .map((poi) => ({
      poi,
      score: computeModeScore(poi, { tags: [...selectedTags] })
    }))
    .filter(({ poi, score }) => {
      const matchesFilterTags = !hasActiveFilter || poi.tags.some((tag) => selectedTags.has(tag));
      const matchesSearch =
        normalizedQuery.length === 0 ||
        poi.name.toLowerCase().includes(normalizedQuery) ||
        poi.categories.some((category) => category.includes(normalizedQuery)) ||
        poi.tags.some((tag) => tag.includes(normalizedQuery)) ||
        getSearchText(poi).includes(normalizedQuery);

      const visibleAtZoom = poi.visibilityMode !== "zoomed-in" || zoom > zoomedInOnlyThreshold;
      const visibleWhenViewed = !hideViewed || !viewedPoiIds.includes(poi.id);
      const visibleWhenFavorite = !hideFavorites || !favoritePoiIds.includes(poi.id);
      const visibleWhenVisited = !hideVisited || !visitedPoiIds.includes(poi.id);

      return (
        visibleAtZoom &&
        visibleWhenViewed &&
        visibleWhenFavorite &&
        visibleWhenVisited &&
        matchesSearch &&
        matchesFilterTags &&
        (hasActiveFilter || score >= threshold || poi.mustVisit)
      );
    })
    .sort((a, b) => {
      if (nearbyOrigin) {
        return haversineDistanceMeters(nearbyOrigin, a.poi.coordinates) - haversineDistanceMeters(nearbyOrigin, b.poi.coordinates);
      }
      return b.score - a.score;
    })
    .map(({ poi }) => poi);
}
