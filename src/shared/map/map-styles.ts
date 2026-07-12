import type { StyleSpecification } from "maplibre-gl";
import type { MapStyleId } from "@/entities/site-setting/model/types";

export type MapStyleOption = {
  id: MapStyleId;
  name: string;
  description: string;
};

export const mapStyleOptions: MapStyleOption[] = [
  {
    id: "openfreemap-bright",
    name: "OpenFreeMap Bright",
    description: "Светлая, контрастная карта — текущий стиль по умолчанию."
  },
  {
    id: "openfreemap-liberty",
    name: "OpenFreeMap Liberty",
    description: "Более насыщенная цветом версия в духе классического OSM."
  },
  {
    id: "carto-positron",
    name: "CARTO Positron",
    description: "Минималистичная светло-серая подложка, акцент на точках интереса."
  },
  {
    id: "carto-dark-matter",
    name: "CARTO Dark Matter",
    description: "Тёмная карта, подходит для ночного интерфейса."
  },
  {
    id: "carto-voyager",
    name: "CARTO Voyager",
    description: "Мягкие тёплые цвета, похоже на Google Maps."
  },
  {
    id: "protomaps",
    name: "Protomaps",
    description: "Самостоятельно размещаемый PMTiles-файл — требует указать URL ниже."
  }
];

const presetStyleUrls: Partial<Record<MapStyleId, string>> = {
  "openfreemap-bright": "https://tiles.openfreemap.org/styles/bright",
  "openfreemap-liberty": "https://tiles.openfreemap.org/styles/liberty",
  "carto-positron": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  "carto-dark-matter": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "carto-voyager": "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
};

export const defaultMapStyleUrl = presetStyleUrls["openfreemap-bright"]!;

export function presetMapStyleUrl(mapStyleId: MapStyleId): string | null {
  return presetStyleUrls[mapStyleId] ?? null;
}

const protomapsAssetsBase = "https://protomaps.github.io/basemaps-assets";

export async function buildProtomapsStyle(pmtilesUrl: string): Promise<StyleSpecification> {
  const { layers, namedFlavor } = await import("@protomaps/basemaps");

  return {
    version: 8,
    glyphs: `${protomapsAssetsBase}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${protomapsAssetsBase}/sprites/v4/light`,
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${pmtilesUrl}`,
        attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    },
    layers: layers("protomaps", namedFlavor("light"), { lang: "en" })
  };
}

export async function resolveMapStyle(
  mapStyleId: MapStyleId,
  protomapsPmtilesUrl: string | null
): Promise<string | StyleSpecification> {
  if (mapStyleId === "protomaps") {
    if (!protomapsPmtilesUrl) {
      console.warn("Protomaps style selected but no PMTiles URL is configured; falling back to default style.");
      return defaultMapStyleUrl;
    }

    const { Protocol } = await import("pmtiles");
    const maplibre = await import("maplibre-gl");
    maplibre.addProtocol("pmtiles", new Protocol().tile);

    return buildProtomapsStyle(protomapsPmtilesUrl);
  }

  return presetMapStyleUrl(mapStyleId) ?? defaultMapStyleUrl;
}
