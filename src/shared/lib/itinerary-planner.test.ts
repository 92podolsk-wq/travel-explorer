import { describe, expect, it } from "vitest";
import { estimateTransitionMinutes, planItineraryDays, sequenceByNearestNeighbor } from "./itinerary-planner";
import { makePoi } from "./test-fixtures/poi";

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
  it("returns no days when there are no candidate POIs", () => {
    expect(planItineraryDays([], 3, 480)).toEqual([]);
  });

  it("splits a single large cluster across multiple days once the time budget is exceeded", () => {
    const pois = [0, 1, 2].map((i) =>
      makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 + i * 0.001 }, durationMinutes: 200, importance: 3 - i })
    );
    const plan = planItineraryDays(pois, 3, 240);
    expect(plan.length).toBeGreaterThan(1);
    const totalPoisPlanned = plan.reduce((sum, day) => sum + day.pois.length, 0);
    expect(totalPoisPlanned).toBe(pois.length);
  });

  it("caps the plan at the requested number of days", () => {
    const farApartPois = [0, 1, 2, 3].map((i) => makePoi({ coordinates: { lat: 30 + i * 5, lng: 130 + i * 5 } }));
    const plan = planItineraryDays(farApartPois, 2, 480);
    expect(plan.length).toBeLessThanOrEqual(2);
  });

  it("orders days starting from the cluster holding the most important POI", () => {
    const importantCluster = [makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 }, importance: 10 })];
    const otherCluster = [makePoi({ coordinates: { lat: 40, lng: 140 }, importance: 1 })];
    const plan = planItineraryDays([...otherCluster, ...importantCluster], 2, 480);
    expect(plan[0].pois[0].importance).toBe(10);
  });

  it("titles a day after the highest-importance urban POI in its cluster", () => {
    const anchor = makePoi({
      coordinates: { lat: 34.6937, lng: 135.5023 },
      category: "urban",
      importance: 9,
      name: "Dotonbori",
      nameByLanguage: { ru: "Дотонбори", en: "Dotonbori", ja: "道頓堀" }
    });
    const sibling = makePoi({ coordinates: { lat: 34.694, lng: 135.5026 }, category: "nature", importance: 1 });
    const plan = planItineraryDays([anchor, sibling], 1, 480);
    expect(plan[0].suggestedTitle).toBe("Dotonbori");
  });
});
