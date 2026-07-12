import type { Coordinates, Poi } from "@/entities/poi/model/types";

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistanceMeters(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

/**
 * Groups POIs into walkable clusters via single-linkage union-find: any two POIs within
 * `maxLinkMeters` end up in the same cluster (transitively, so a chain of nearby points forms
 * one cluster even if its endpoints are farther apart than the threshold). Clusters are ordered
 * descending by their most important member, so index 0 already contains the globally most
 * important POI.
 */
export function clusterPoisByProximity(pois: Poi[], maxLinkMeters = 1200): Poi[][] {
  const parent = pois.map((_, index) => index);

  function find(index: number): number {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  }

  function union(a: number, b: number) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) {
      parent[rootB] = rootA;
    }
  }

  for (let i = 0; i < pois.length; i++) {
    for (let j = i + 1; j < pois.length; j++) {
      if (haversineDistanceMeters(pois[i].coordinates, pois[j].coordinates) <= maxLinkMeters) {
        union(i, j);
      }
    }
  }

  const clusters = new Map<number, Poi[]>();
  pois.forEach((poi, index) => {
    const root = find(index);
    const cluster = clusters.get(root);
    if (cluster) {
      cluster.push(poi);
    } else {
      clusters.set(root, [poi]);
    }
  });

  return [...clusters.values()].sort(
    (a, b) => Math.max(...b.map((poi) => poi.importance)) - Math.max(...a.map((poi) => poi.importance))
  );
}
