import { describe, expect, it } from "vitest";
import { buildRegionVoronoi, emptyRegionVoronoiCollection, regionVoronoiColors } from "./region-voronoi";
import type { Region } from "@/entities/region/model/types";

function makeRegion(overrides: Partial<Region> = {}, index = 0): Region {
  return {
    id: `region-${index}`,
    name: `Region ${index}`,
    areaId: "kansai",
    center: { lat: 34.6937 + index, lng: 135.5023 + index },
    defaultZoom: 12,
    bounds: [
      [135.4, 34.6],
      [135.6, 34.8]
    ],
    timezoneOffsetHours: 9,
    nameByLanguage: { ru: `Регион ${index}`, en: `Region ${index}` },
    sealCharacter: "京",
    status: "published",
    ...overrides
  };
}

describe("buildRegionVoronoi", () => {
  it("returns an empty collection for fewer than two regions", () => {
    expect(buildRegionVoronoi([], "en")).toEqual(emptyRegionVoronoiCollection);
    expect(buildRegionVoronoi([makeRegion()], "en")).toEqual(emptyRegionVoronoiCollection);
  });

  it("produces one polygon feature per region", () => {
    const regions = [makeRegion({}, 0), makeRegion({}, 1), makeRegion({}, 2)];
    const collection = buildRegionVoronoi(regions, "en");

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(3);
    for (const feature of collection.features) {
      expect(feature.geometry.type).toBe("Polygon");
      expect(feature.geometry.coordinates[0].length).toBeGreaterThan(2);
    }
  });

  it("labels each feature with the localized region name and a cycled color", () => {
    const regions = [makeRegion({}, 0), makeRegion({}, 1)];
    const collection = buildRegionVoronoi(regions, "ru");

    expect(collection.features.map((f) => f.properties.name)).toEqual(["Регион 0", "Регион 1"]);
    expect(collection.features[0].properties.color).toBe(regionVoronoiColors[0]);
    expect(collection.features[1].properties.color).toBe(regionVoronoiColors[1]);
  });

  it("falls back to the plain name when a localized name is missing", () => {
    const region = makeRegion({}, 0);
    region.nameByLanguage = { ...region.nameByLanguage, en: undefined as unknown as string };
    const other = makeRegion({}, 1);
    const collection = buildRegionVoronoi([region, other], "en");
    expect(collection.features[0].properties.name).toBe(region.name);
  });
});
