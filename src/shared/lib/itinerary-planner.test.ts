import { describe, expect, it } from "vitest";
import { estimateTransitionMinutes, planItineraryDays, sequenceByNearestNeighbor } from "./itinerary-planner";
import { makePoi } from "./test-fixtures/poi";
import type { WalkingDistanceMatrix } from "./osrm-matrix";

// Stub out the OSRM lookup so these tests stay deterministic and offline; they fall back to the
// same haversine-based estimate the planner always used before real-matrix support was added.
const noMatrix = async () => null;

describe("estimateTransitionMinutes", () => {
  it("clamps very short distances to the 5 minute minimum", () => {
    expect(estimateTransitionMinutes(0)).toBe(5);
    expect(estimateTransitionMinutes(100)).toBe(5);
  });

  it("clamps very long distances to the 60 minute maximum", () => {
    expect(estimateTransitionMinutes(10000)).toBe(60);
  });

  it("scales linearly with distance in between", () => {
    expect(estimateTransitionMinutes(750)).toBe(10);
  });
});

describe("sequenceByNearestNeighbor", () => {
  it("starts from the most important item", () => {
    const low = { coordinates: { lat: 0, lng: 0 }, importance: 1, id: "low" };
    const high = { coordinates: { lat: 10, lng: 10 }, importance: 9, id: "high" };
    const ordered = sequenceByNearestNeighbor([low, high]);
    expect(ordered[0].id).toBe("high");
  });

  it("visits the nearest remaining item next", () => {
    const start = { coordinates: { lat: 0, lng: 0 }, importance: 5, id: "start" };
    const near = { coordinates: { lat: 0.01, lng: 0.01 }, importance: 1, id: "near" };
    const far = { coordinates: { lat: 5, lng: 5 }, importance: 1, id: "far" };
    const ordered = sequenceByNearestNeighbor([start, far, near]);
    expect(ordered.map((item) => item.id)).toEqual(["start", "near", "far"]);
  });

  it("returns an empty array for no items", () => {
    expect(sequenceByNearestNeighbor([])).toEqual([]);
  });
});

describe("planItineraryDays", () => {
  it("returns no days when there are no candidate POIs", async () => {
    expect(await planItineraryDays([], 3, 480, "en", noMatrix)).toEqual([]);
  });

  it("splits a single large cluster across multiple days once the time budget is exceeded", async () => {
    const pois = [0, 1, 2].map((i) =>
      makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 + i * 0.001 }, durationMinutes: 200, importance: 3 - i })
    );
    const plan = await planItineraryDays(pois, 3, 240, "en", noMatrix);
    expect(plan.length).toBeGreaterThan(1);
    const totalPoisPlanned = plan.reduce((sum, day) => sum + day.pois.length, 0);
    expect(totalPoisPlanned).toBe(pois.length);
  });

  it("caps the plan at the requested number of days", async () => {
    const farApartPois = [0, 1, 2, 3].map((i) => makePoi({ coordinates: { lat: 30 + i * 5, lng: 130 + i * 5 } }));
    const plan = await planItineraryDays(farApartPois, 2, 480, "en", noMatrix);
    expect(plan.length).toBeLessThanOrEqual(2);
  });

  it("orders days starting from the cluster holding the most important POI", async () => {
    const importantCluster = [makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 }, importance: 10 })];
    const otherCluster = [makePoi({ coordinates: { lat: 40, lng: 140 }, importance: 1 })];
    const plan = await planItineraryDays([...otherCluster, ...importantCluster], 2, 480, "en", noMatrix);
    expect(plan[0].pois[0].importance).toBe(10);
  });

  it("titles a day after the highest-importance urban POI in its cluster", async () => {
    const anchor = makePoi({
      coordinates: { lat: 34.6937, lng: 135.5023 },
      category: "urban",
      importance: 9,
      name: "Dotonbori",
      nameByLanguage: { ru: "Дотонбори", en: "Dotonbori", ja: "道頓堀" }
    });
    const sibling = makePoi({ coordinates: { lat: 34.694, lng: 135.5026 }, category: "nature", importance: 1 });
    const plan = await planItineraryDays([anchor, sibling], 1, 480, "en", noMatrix);
    expect(plan[0].suggestedTitle).toBe("Dotonbori");
  });

  it("prefers a real walking-matrix distance over the straight-line estimate when one is available", async () => {
    // "near" is geographically closer to the anchor than "detour", but the stubbed OSRM matrix
    // reports the opposite (as a river/hill detour would in reality) — the planner should follow
    // the real-walking order, proving the matrix path is actually wired in and takes priority.
    const anchor = makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 }, importance: 5, durationMinutes: 30 });
    const near = makePoi({ coordinates: { lat: 34.6938, lng: 135.5024 }, importance: 1, durationMinutes: 30 });
    const detour = makePoi({ coordinates: { lat: 34.6945, lng: 135.503 }, importance: 1, durationMinutes: 30 });
    const pois = [anchor, near, detour];

    const fakeMatrix = async (): Promise<WalkingDistanceMatrix> => ({
      distancesMeters: [
        [0, 5000, 50],
        [5000, 0, 5000],
        [50, 5000, 0]
      ],
      durationsMinutes: [
        [0, 60, 5],
        [60, 0, 60],
        [5, 60, 0]
      ]
    });

    const plan = await planItineraryDays(pois, 1, 480, "en", fakeMatrix);
    expect(plan[0].pois.map((poi) => poi.id)).toEqual([anchor.id, detour.id, near.id]);
  });
});
