import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";

const WALKING_METERS_PER_MINUTE = 75;

export function computeItinerarySummary(pois: Poi[]) {
  const visitMinutes = pois.reduce((sum, poi) => sum + poi.durationMinutes, 0);

  let walkingDistanceMeters = 0;
  for (let i = 0; i < pois.length - 1; i++) {
    walkingDistanceMeters += haversineDistanceMeters(pois[i].coordinates, pois[i + 1].coordinates);
  }
  const walkingMinutes = Math.round(walkingDistanceMeters / WALKING_METERS_PER_MINUTE);

  return {
    visitMinutes,
    walkingMinutes,
    totalMinutes: visitMinutes + walkingMinutes,
    walkingDistanceMeters
  };
}
