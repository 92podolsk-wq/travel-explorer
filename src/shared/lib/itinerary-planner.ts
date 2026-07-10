import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "./geo";

const TRANSITION_METERS_PER_MINUTE = 75;
const MIN_TRANSITION_MINUTES = 5;
const MAX_TRANSITION_MINUTES = 60;

function estimateTransitionMinutes(distanceMeters: number): number {
  return Math.min(MAX_TRANSITION_MINUTES, Math.max(MIN_TRANSITION_MINUTES, Math.round(distanceMeters / TRANSITION_METERS_PER_MINUTE)));
}

export function planItineraryDays(candidates: Poi[], days: number, minutesPerDay: number): Poi[][] {
  const remaining = [...candidates].sort((a, b) => b.importance - a.importance);
  const plan: Poi[][] = [];

  for (let day = 0; day < days && remaining.length > 0; day++) {
    const dayStops: Poi[] = [];
    let usedMinutes = 0;

    let current = remaining.shift();
    if (!current) break;
    dayStops.push(current);
    usedMinutes += current.durationMinutes;

    while (remaining.length > 0) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const distance = haversineDistanceMeters(current.coordinates, remaining[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const candidate = remaining[nearestIndex];
      const cost = estimateTransitionMinutes(nearestDistance) + candidate.durationMinutes;
      if (usedMinutes + cost > minutesPerDay) break;

      remaining.splice(nearestIndex, 1);
      dayStops.push(candidate);
      usedMinutes += cost;
      current = candidate;
    }

    plan.push(dayStops);
  }

  return plan;
}
