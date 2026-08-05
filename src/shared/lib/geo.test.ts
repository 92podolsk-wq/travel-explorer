import { describe, expect, it } from "vitest";
import { clusterPoisByProximity, formatDistance, haversineDistanceMeters } from "./geo";
import { makePoi } from "./test-fixtures/poi";

describe("haversineDistanceMeters", () => {
  it("is zero for the same point", () => {
    const point = { lat: 34.6937, lng: 135.5023 };
    expect(haversineDistanceMeters(point, point)).toBeCloseTo(0, 5);
  });

  it("matches the known distance between Osaka and Kyoto stations (~40km)", () => {
    const osaka = { lat: 34.7024, lng: 135.4959 };
    const kyoto = { lat: 34.9858, lng: 135.7588 };
    const meters = haversineDistanceMeters(osaka, kyoto);
    expect(meters).toBeGreaterThan(35000);
    expect(meters).toBeLessThan(45000);
  });

  it("is symmetric", () => {
    const a = { lat: 34.6937, lng: 135.5023 };
    const b = { lat: 34.9858, lng: 135.7588 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 6);
  });
});

describe("formatDistance", () => {
  it("rounds sub-kilometer distances to the nearest 10m in meters", () => {
    expect(formatDistance(123)).toBe("120 м");
    expect(formatDistance(999)).toBe("1000 м");
  });

  it("formats kilometer-plus distances with one decimal", () => {
    expect(formatDistance(1500)).toBe("1.5 км");
    expect(formatDistance(42000)).toBe("42.0 км");
  });
});

describe("clusterPoisByProximity", () => {
  it("keeps far-apart POIs in separate clusters", () => {
    const near = makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 } });
    const far = makePoi({ coordinates: { lat: 35.0, lng: 136.0 } });
    const clusters = clusterPoisByProximity([near, far], 1200);
    expect(clusters).toHaveLength(2);
  });

  it("merges POIs within the link distance into one cluster", () => {
    const a = makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 } });
    const b = makePoi({ coordinates: { lat: 34.694, lng: 135.5026 } });
    const clusters = clusterPoisByProximity([a, b], 1200);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(2);
  });

  it("transitively chains a line of nearby points into a single cluster", () => {
    const step = 0.005;
    const chain = [0, 1, 2, 3].map((i) => makePoi({ coordinates: { lat: 34.6937 + i * step, lng: 135.5023 } }));
    const clusters = clusterPoisByProximity(chain, 700);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(4);
  });

  it("orders clusters descending by their most important member", () => {
    const lowImportance = makePoi({ coordinates: { lat: 34.6937, lng: 135.5023 }, importance: 1 });
    const highImportance = makePoi({ coordinates: { lat: 35.0, lng: 136.0 }, importance: 9 });
    const clusters = clusterPoisByProximity([lowImportance, highImportance], 1200);
    expect(clusters[0][0].id).toBe(highImportance.id);
  });

  it("returns an empty array for no input", () => {
    expect(clusterPoisByProximity([])).toEqual([]);
  });
});
