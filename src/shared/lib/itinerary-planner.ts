import type { Coordinates, Poi } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { clusterPoisByProximity, haversineDistanceMeters } from "./geo";

const TRANSITION_METERS_PER_MINUTE = 75;
const MIN_TRANSITION_MINUTES = 5;
const MAX_TRANSITION_MINUTES = 60;

export function estimateTransitionMinutes(distanceMeters: number): number {
  return Math.min(MAX_TRANSITION_MINUTES, Math.max(MIN_TRANSITION_MINUTES, Math.round(distanceMeters / TRANSITION_METERS_PER_MINUTE)));
}

export type PlannedDay = {
  pois: Poi[];
  suggestedTitle: string;
};

/**
 * Orders a set of POIs (assumed to already be geographically close, i.e. one cluster) into one or
 * more day-sized lists: greedily walks to the nearest remaining POI, starting a new day whenever
 * the running day's time budget would be exceeded, so a cluster too big for a single day spills
 * into consecutive days instead of getting cut off.
 */
function sequenceClusterByNearestNeighbor(pois: Poi[], minutesPerDay: number): Poi[][] {
  const remaining = [...pois].sort((a, b) => b.importance - a.importance);
  const days: Poi[][] = [];

  while (remaining.length > 0) {
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

    days.push(dayStops);
  }

  return days;
}

/** Orders items into a single visiting sequence via nearest-neighbor, no time budget — used to re-sequence an already-assigned day. */
export function sequenceByNearestNeighbor<T extends { coordinates: Coordinates; importance?: number }>(items: T[]): T[] {
  const remaining = [...items].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  const ordered: T[] = [];

  let current = remaining.shift();
  if (!current) return ordered;
  ordered.push(current);

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

    current = remaining[nearestIndex];
    remaining.splice(nearestIndex, 1);
    ordered.push(current);
  }

  return ordered;
}

function suggestClusterTitle(cluster: Poi[], language: Language): string {
  const districtPois = cluster.filter((poi) => poi.categories.includes("district"));
  const pool = districtPois.length > 0 ? districtPois : cluster;
  const anchor = pool.reduce((best, poi) => (poi.importance > best.importance ? poi : best), pool[0]);
  return anchor.nameByLanguage[language] ?? anchor.name;
}

function clusterCentroid(cluster: Poi[]): { lat: number; lng: number } {
  return {
    lat: cluster.reduce((sum, poi) => sum + poi.coordinates.lat, 0) / cluster.length,
    lng: cluster.reduce((sum, poi) => sum + poi.coordinates.lng, 0) / cluster.length
  };
}

/**
 * Groups candidates into walkable clusters, orders the clusters by nearest-neighbor chaining
 * (starting from the cluster holding the globally most important POI), then sequences each
 * cluster into one or more day-sized stop lists until `days` is filled.
 */
export function planItineraryDays(
  candidates: Poi[],
  days: number,
  minutesPerDay: number,
  language: Language = "en"
): PlannedDay[] {
  const clusters = clusterPoisByProximity(candidates);
  if (clusters.length === 0) {
    return [];
  }

  const remainingClusters = [...clusters];
  const orderedClusters: Poi[][] = [];

  let current = remainingClusters.shift();
  if (!current) return [];
  orderedClusters.push(current);
  let currentCentroid = clusterCentroid(current);

  while (remainingClusters.length > 0) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;
    for (let i = 0; i < remainingClusters.length; i++) {
      const distance = haversineDistanceMeters(currentCentroid, clusterCentroid(remainingClusters[i]));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = remainingClusters[nearestIndex];
    remainingClusters.splice(nearestIndex, 1);
    orderedClusters.push(current);
    currentCentroid = clusterCentroid(current);
  }

  const plan: PlannedDay[] = [];
  for (const cluster of orderedClusters) {
    if (plan.length >= days) break;

    const suggestedTitle = suggestClusterTitle(cluster, language);
    const clusterDays = sequenceClusterByNearestNeighbor(cluster, minutesPerDay);
    for (const dayPois of clusterDays) {
      if (plan.length >= days) break;
      plan.push({ pois: dayPois, suggestedTitle });
    }
  }

  return plan.slice(0, days);
}
