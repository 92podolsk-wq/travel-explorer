import { Delaunay } from "d3-delaunay";
import type { Region } from "@/entities/region/model/types";
import type { Language } from "@/shared/i18n/types";

export const regionVoronoiColors = [
  "#c9834b",
  "#4d7a6b",
  "#4d6fa8",
  "#a8567a",
  "#8a7a3f",
  "#4b8a8a",
  "#a85b4b",
  "#6a5b8a",
  "#6f8a3f",
  "#8a4b6a"
];

export type RegionVoronoiFeature = {
  type: "Feature";
  properties: { regionId: string; name: string; color: string };
  geometry: { type: "Polygon"; coordinates: [number, number][][] };
};

export type RegionVoronoiCollection = {
  type: "FeatureCollection";
  features: RegionVoronoiFeature[];
};

export const emptyRegionVoronoiCollection: RegionVoronoiCollection = {
  type: "FeatureCollection",
  features: []
};

export function buildRegionVoronoi(regions: Region[], language: Language): RegionVoronoiCollection {
  if (regions.length < 2) {
    return emptyRegionVoronoiCollection;
  }

  const points: [number, number][] = regions.map((region) => [region.center.lng, region.center.lat]);
  const lngs = points.map((point) => point[0]);
  const lats = points.map((point) => point[1]);
  const lngPad = Math.max((Math.max(...lngs) - Math.min(...lngs)) * 0.6, 0.3);
  const latPad = Math.max((Math.max(...lats) - Math.min(...lats)) * 0.6, 0.3);

  const bounds: [number, number, number, number] = [
    Math.min(...lngs) - lngPad,
    Math.min(...lats) - latPad,
    Math.max(...lngs) + lngPad,
    Math.max(...lats) + latPad
  ];

  const voronoi = Delaunay.from(points).voronoi(bounds);

  const features: RegionVoronoiFeature[] = [];
  regions.forEach((region, index) => {
    const cell = voronoi.cellPolygon(index);
    if (!cell) return;

    features.push({
      type: "Feature",
      properties: {
        regionId: region.id,
        name: region.nameByLanguage[language] ?? region.name,
        color: regionVoronoiColors[index % regionVoronoiColors.length]
      },
      geometry: { type: "Polygon", coordinates: [cell as [number, number][]] }
    });
  });

  return { type: "FeatureCollection", features };
}
