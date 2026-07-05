import type { Poi } from "@/entities/poi/model/types";

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function haversineKm(a: Poi, b: Poi) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.coordinates.lat - a.coordinates.lat);
  const dLng = toRadians(b.coordinates.lng - a.coordinates.lng);
  const lat1 = toRadians(a.coordinates.lat);
  const lat2 = toRadians(b.coordinates.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function totalDistance(order: Poi[]) {
  let sum = 0;
  for (let i = 0; i < order.length - 1; i++) {
    sum += haversineKm(order[i], order[i + 1]);
  }
  return sum;
}

function nearestNeighborOrder(pois: Poi[]) {
  const remaining = [...pois];
  const order = [remaining.shift() as Poi];

  while (remaining.length > 0) {
    const last = order[order.length - 1];
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((candidate, index) => {
      const distance = haversineKm(last, candidate);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    order.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return order;
}

// 2-opt local search: repeatedly reverse a segment of the path if it shortens the total distance.
function twoOptImprove(initialOrder: Poi[]) {
  let best = initialOrder;
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 1; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const candidate = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];

        if (totalDistance(candidate) < totalDistance(best) - 1e-9) {
          best = candidate;
          improved = true;
        }
      }
    }
  }

  return best;
}

/** Reorders places to shorten the total travel path (nearest-neighbor + 2-opt heuristic). */
export function optimizeRouteOrder(pois: Poi[]): Poi[] {
  if (pois.length <= 2) {
    return pois;
  }

  return twoOptImprove(nearestNeighborOrder(pois));
}
