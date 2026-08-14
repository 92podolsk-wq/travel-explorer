import type { Coordinates, Poi } from "@/entities/poi/model/types";
import type { Language } from "@/shared/i18n/types";
import { clusterPoisByProximity, haversineDistanceMeters } from "./geo";
import { fetchWalkingDistanceMatrix, type WalkingDistanceMatrix } from "./osrm-matrix";

const TRANSITION_METERS_PER_MINUTE = 75;
const MIN_TRANSITION_MINUTES = 5;
const MAX_TRANSITION_MINUTES = 60;

export function estimateTransitionMinutes(distanceMeters: number): number {
  return Math.min(MAX_TRANSITION_MINUTES, Math.max(MIN_TRANSITION_MINUTES, Math.round(distanceMeters / TRANSITION_METERS_PER_MINUTE)));
}

type Transition = { meters: number; minutes: number };
type DistanceEstimator = (a: Poi, b: Poi) => Transition;

function haversineTransition(a: Poi, b: Poi): Transition {
  const meters = haversineDistanceMeters(a.coordinates, b.coordinates);
  return { meters, minutes: estimateTransitionMinutes(meters) };
}

/**
 * Builds a same-cluster distance lookup backed by a real walking matrix (from OSRM) when one is
 * available, falling back to the straight-line estimate per-pair whenever the matrix is missing
 * or a specific cell is absent/invalid — so a partial OSRM failure degrades gracefully instead of
 * discarding the whole cluster's real data.
 */
function buildDistanceEstimator(cluster: Poi[], matrix: WalkingDistanceMatrix | null): DistanceEstimator {
  if (!matrix) return haversineTransition;

  const indexById = new Map(cluster.map((poi, index) => [poi.id, index]));
  return (a, b) => {
    const i = indexById.get(a.id);
    const j = indexById.get(b.id);
    const meters = i != null && j != null ? matrix.distancesMeters[i]?.[j] : undefined;
    const minutes = i != null && j != null ? matrix.durationsMinutes[i]?.[j] : undefined;
    if (meters == null || minutes == null || !Number.isFinite(meters) || !Number.isFinite(minutes)) {
      return haversineTransition(a, b);
    }
    return { meters, minutes: Math.min(MAX_TRANSITION_MINUTES, Math.max(MIN_TRANSITION_MINUTES, Math.round(minutes))) };
  };
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
function sequenceClusterByNearestNeighbor(pois: Poi[], minutesPerDay: number, distanceEstimator: DistanceEstimator): Poi[][] {
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
      let nearestTransitionMinutes = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const { minutes } = distanceEstimator(current, remaining[i]);
        if (minutes < nearestTransitionMinutes) {
          nearestTransitionMinutes = minutes;
          nearestIndex = i;
        }
      }

      const candidate = remaining[nearestIndex];
      const cost = nearestTransitionMinutes + candidate.durationMinutes;
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
  const districtPois = cluster.filter((poi) => poi.category === "urban");
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
 *
 * Sequencing within a cluster prefers real walking distances/durations (fetched from OSRM,
 * one matrix request per cluster actually used) over the straight-line estimate, since two POIs
 * that look close on a map can be a long detour apart (river, hill, no direct path). `fetchMatrix`
 * is injectable so tests can stub it out and stay deterministic/offline.
 */
export async function planItineraryDays(
  candidates: Poi[],
  days: number,
  minutesPerDay: number,
  language: Language = "en",
  fetchMatrix: typeof fetchWalkingDistanceMatrix = fetchWalkingDistanceMatrix
): Promise<PlannedDay[]> {
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
    const matrix = cluster.length >= 2 ? await fetchMatrix(cluster.map((poi) => poi.coordinates)) : null;
    const distanceEstimator = buildDistanceEstimator(cluster, matrix);
    const clusterDays = sequenceClusterByNearestNeighbor(cluster, minutesPerDay, distanceEstimator);
    for (const dayPois of clusterDays) {
      if (plan.length >= days) break;
      plan.push({ pois: dayPois, suggestedTitle });
    }
  }

  return plan.slice(0, days);
}
