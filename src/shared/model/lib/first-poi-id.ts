import type { Poi } from "@/entities/poi/model/types";

// Shared by reference-data-slice (setPois) and map-filter-slice (initial
// selectedPoiId, setActiveRegion/Area/Country) — both need to pick a
// fallback selected POI whenever the active region set or the POI list
// itself changes.
export function firstPoiIdForRegion(pois: Poi[], regionId: string) {
  return pois.find((poi) => poi.regionId === regionId)?.id ?? pois[0]?.id ?? "";
}

export function firstPoiIdForRegions(pois: Poi[], regionIds: string[]) {
  return pois.find((poi) => regionIds.includes(poi.regionId))?.id ?? pois[0]?.id ?? "";
}
