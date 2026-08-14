import type { Coordinates } from "@/entities/poi/model/types";

// The public OSRM demo server caps table requests around 100 coordinates; anything
// larger falls back to the haversine estimate rather than risking a rejected request.
const OSRM_TABLE_MAX_COORDINATES = 100;
const OSRM_TABLE_TIMEOUT_MS = 8000;

export type WalkingDistanceMatrix = {
  distancesMeters: number[][];
  durationsMinutes: number[][];
};

type OsrmTableResponse = {
  code?: string;
  distances?: number[][];
  durations?: number[][];
};

/** Fetches a full pairwise real-walking distance/duration matrix in one request via OSRM's Table service. */
export async function fetchWalkingDistanceMatrix(coordinates: Coordinates[]): Promise<WalkingDistanceMatrix | null> {
  if (coordinates.length < 2 || coordinates.length > OSRM_TABLE_MAX_COORDINATES) {
    return null;
  }

  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OSRM_TABLE_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://router.project-osrm.org/table/v1/foot/${coordStr}?annotations=distance,duration`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as OsrmTableResponse;
    if (data.code !== "Ok" || !Array.isArray(data.distances) || !Array.isArray(data.durations)) {
      return null;
    }

    return {
      distancesMeters: data.distances,
      durationsMinutes: data.durations.map((row) => row.map((seconds) => seconds / 60))
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
