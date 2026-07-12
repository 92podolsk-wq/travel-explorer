import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";

const WALKING_METERS_PER_MINUTE = 75;

export function computeItinerarySummary(stops: { poi: Poi; durationOverrideMinutes?: number | null }[]) {
  const visitMinutes = stops.reduce((sum, stop) => sum + (stop.durationOverrideMinutes ?? stop.poi.durationMinutes), 0);

  let walkingDistanceMeters = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    walkingDistanceMeters += haversineDistanceMeters(stops[i].poi.coordinates, stops[i + 1].poi.coordinates);
  }
  const walkingMinutes = Math.round(walkingDistanceMeters / WALKING_METERS_PER_MINUTE);

  return {
    visitMinutes,
    walkingMinutes,
    totalMinutes: visitMinutes + walkingMinutes,
    walkingDistanceMeters
  };
}
