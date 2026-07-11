"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  Marker as MapLibreMarker,
  StyleSpecification
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type { Poi, PoiCategory } from "@/entities/poi/model/types";
import { findRegionById } from "@/entities/region/model/regions";
import type { Region } from "@/entities/region/model/types";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { buildProtomapsStyle, defaultMapStyleUrl, presetMapStyleUrl } from "@/shared/map/map-styles";
import { categoryMarkerColors, registerCategoryMarkerIcons } from "@/shared/map/poi-marker-icons";
import { buildRegionVoronoi, emptyRegionVoronoiCollection, type RegionVoronoiCollection } from "@/shared/map/region-voronoi";
import { useExplorerStore } from "@/shared/model/explorer-store";

const poiSourceId = "travel-explorer-pois";
const poiHitLayerId = "poi-hit-area";
const poiCircleLayerId = "poi-circles";
const poiIconLayerId = "poi-icons";
const poiLabelLayerId = "poi-labels";
const routeSourceId = "travel-explorer-itinerary-route";
const routeLayerId = "itinerary-route-line";
const routeApproximateLayerId = "itinerary-route-line-approximate";
const regionVoronoiSourceId = "travel-explorer-region-voronoi";
const regionVoronoiFillLayerId = "region-voronoi-fill";
const regionVoronoiLineLayerId = "region-voronoi-line";
const regionVoronoiLabelLayerId = "region-voronoi-label";

type PoiFeatureProperties = {
  id: string;
  name: string;
  selected: boolean;
  mustVisit: boolean;
  viewed: boolean;
  favorite: boolean;
  category: PoiCategory;
};

type PoiFeature = Feature<Point, PoiFeatureProperties>;
type PoiFeatureCollection = FeatureCollection<Point, PoiFeatureProperties>;
type RouteFeatureCollection = FeatureCollection<LineString, { approximate: boolean }>;

const emptyPoiCollection: PoiFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const emptyRouteCollection: RouteFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

function createPoiCollection(
  pois: Poi[],
  selectedPoiId: string,
  viewedPoiIds: string[],
  favoritePoiIds: string[]
): PoiFeatureCollection {
  return {
    type: "FeatureCollection",
    features: pois.map(
      (poi): PoiFeature => ({
        type: "Feature",
        id: poi.id,
        geometry: {
          type: "Point",
          coordinates: [poi.coordinates.lng, poi.coordinates.lat]
        },
        properties: {
          id: poi.id,
          name: poi.name,
          selected: poi.id === selectedPoiId,
          mustVisit: poi.mustVisit,
          viewed: viewedPoiIds.includes(poi.id),
          favorite: favoritePoiIds.includes(poi.id),
          category: poi.categories[0] ?? "district"
        }
      })
    )
  };
}

function getPoiIdFromEvent(event: MapLayerMouseEvent) {
  const feature = event.features?.[0];
  const id = feature?.properties?.id;

  return typeof id === "string" ? id : null;
}

const categoryColorMatchExpression = [
  "match",
  ["get", "category"],
  ...Object.entries(categoryMarkerColors).flatMap(([category, color]) => [category, color]),
  "#7a7a7a"
] as unknown as ExpressionSpecification;

async function addPoiLayers(map: MapLibreMap) {
  if (map.getSource(poiSourceId)) {
    return;
  }

  await registerCategoryMarkerIcons(map);

  map.addSource(regionVoronoiSourceId, {
    type: "geojson",
    data: emptyRegionVoronoiCollection
  });

  map.addLayer({
    id: regionVoronoiFillLayerId,
    type: "fill",
    source: regionVoronoiSourceId,
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": 0.14
    }
  });

  map.addLayer({
    id: regionVoronoiLineLayerId,
    type: "line",
    source: regionVoronoiSourceId,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["get", "color"],
      "line-width": 2,
      "line-opacity": 0.7
    }
  });

  map.addLayer({
    id: regionVoronoiLabelLayerId,
    type: "symbol",
    source: regionVoronoiSourceId,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Bold"],
      "text-size": 16,
      "text-transform": "uppercase",
      "text-letter-spacing": 0.08,
      "text-allow-overlap": false
    },
    paint: {
      "text-color": ["get", "color"],
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.8
    }
  });

  map.addSource(routeSourceId, {
    type: "geojson",
    data: emptyRouteCollection
  });

  map.addLayer({
    id: routeLayerId,
    type: "line",
    source: routeSourceId,
    filter: ["==", ["get", "approximate"], false],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#287f72",
      "line-width": 3,
      "line-opacity": 0.75
    }
  });

  map.addLayer({
    id: routeApproximateLayerId,
    type: "line",
    source: routeSourceId,
    filter: ["==", ["get", "approximate"], true],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#287f72",
      "line-width": 3,
      "line-opacity": 0.75,
      "line-dasharray": [2, 1.5]
    }
  });

  map.addSource(poiSourceId, {
    type: "geojson",
    data: emptyPoiCollection
  });

  map.addLayer({
    id: poiHitLayerId,
    type: "circle",
    source: poiSourceId,
    paint: {
      "circle-radius": 24,
      "circle-color": "rgba(0, 0, 0, 0)",
      "circle-stroke-width": 0
    }
  });

  map.addLayer({
    id: poiCircleLayerId,
    type: "circle",
    source: poiSourceId,
    paint: {
      "circle-radius": [
        "case",
        ["==", ["get", "selected"], true],
        19,
        ["==", ["get", "mustVisit"], true],
        15,
        12.5
      ],
      "circle-color": [
        "case",
        ["==", ["get", "selected"], true],
        "#287f72",
        ["all", ["==", ["get", "viewed"], true], ["==", ["get", "favorite"], false]],
        "#b0b0a8",
        categoryColorMatchExpression
      ],
      "circle-stroke-color": [
        "case",
        ["==", ["get", "selected"], true],
        "#1d5c52",
        ["==", ["get", "favorite"], true],
        "#9d174d",
        "#ffffff"
      ],
      "circle-stroke-width": [
        "case",
        ["==", ["get", "selected"], true],
        4.5,
        ["==", ["get", "favorite"], true],
        3.5,
        3
      ],
      "circle-opacity": [
        "case",
        ["==", ["get", "selected"], true],
        1,
        ["all", ["==", ["get", "viewed"], true], ["==", ["get", "favorite"], false]],
        0.55,
        1
      ]
    }
  });

  map.addLayer({
    id: poiIconLayerId,
    type: "symbol",
    source: poiSourceId,
    layout: {
      "icon-image": ["concat", "poi-icon-", ["get", "category"]],
      "icon-size": ["case", ["==", ["get", "selected"], true], 0.95, 0.72],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true
    },
    paint: {
      "icon-opacity": [
        "case",
        ["==", ["get", "selected"], true],
        1,
        ["all", ["==", ["get", "viewed"], true], ["==", ["get", "favorite"], false]],
        0.6,
        1
      ]
    }
  });

  map.addLayer({
    id: poiLabelLayerId,
    type: "symbol",
    source: poiSourceId,
    minzoom: 12,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-anchor": "top",
      "text-offset": [0, 1.35],
      "text-allow-overlap": false,
      "text-ignore-placement": false
    },
    paint: {
      "text-color": [
        "case",
        ["all", ["==", ["get", "viewed"], true], ["==", ["get", "favorite"], false]],
        "#9a9a92",
        "#23313d"
      ],
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6
    }
  });
}

async function resolveMapStyle(
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

function boundsFromPois(pois: Poi[]): [[number, number], [number, number]] {
  const lngs = pois.map((poi) => poi.coordinates.lng);
  const lats = pois.map((poi) => poi.coordinates.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

const desktopBreakpointPx = 1024;

function getFitBoundsPadding(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === "undefined") {
    return { top: 70, bottom: 70, left: 70, right: 70 };
  }

  if (window.innerWidth >= desktopBreakpointPx) {
    // Desktop: the sidebar floats top-left, so keep bounds clear of it instead of the bottom.
    return { top: 60, bottom: 60, left: 420, right: 60 };
  }

  // Mobile: the collapsed bottom sheet covers ~236px plus the safe-area inset.
  return { top: 40, bottom: 280, left: 40, right: 40 };
}

const languageToBasemapNameField: Record<Language, string> = {
  en: "name:en",
  ru: "name:ru",
  ja: "name:ja"
};

function applyBasemapLanguage(map: MapLibreMap, language: Language) {
  const nameField = languageToBasemapNameField[language];
  const layers = map.getStyle()?.layers ?? [];

  layers.forEach((layer) => {
    if (layer.type !== "symbol" || layer.source === poiSourceId || layer.source === regionVoronoiSourceId) {
      return;
    }

    const layout = "layout" in layer ? layer.layout : undefined;

    if (!layout || !("text-field" in layout)) {
      return;
    }

    map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", nameField], ["get", "name"]]);
  });
}

function hideBasemapPoiLayers(map: MapLibreMap) {
  const layers = map.getStyle()?.layers ?? [];

  layers.forEach((layer) => {
    const sourceLayer = "source-layer" in layer ? layer["source-layer"] : undefined;
    const isPoiLayer = /poi/i.test(layer.id) || (typeof sourceLayer === "string" && /poi/i.test(sourceLayer));

    if (isPoiLayer) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
}

function setPoiSourceData(map: MapLibreMap, data: PoiFeatureCollection) {
  const source = map.getSource(poiSourceId);

  if (!source) {
    return;
  }

  (source as GeoJSONSource).setData(data);
}

function setRouteSourceData(map: MapLibreMap, data: RouteFeatureCollection) {
  const source = map.getSource(routeSourceId);

  if (!source) {
    return;
  }

  (source as GeoJSONSource).setData(data);
}

function setRegionVoronoiSourceData(map: MapLibreMap, data: RegionVoronoiCollection) {
  const source = map.getSource(regionVoronoiSourceId);

  if (!source) {
    return;
  }

  (source as GeoJSONSource).setData(data);
}

async function fetchWalkingRouteCoordinates(coordinates: Poi["coordinates"][]): Promise<[number, number][] | null> {
  const coordStr = coordinates.map((c) => `${c.lng},${c.lat}`).join(";");

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${coordStr}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;

    const data = (await res.json()) as { routes?: Array<{ geometry?: { coordinates?: [number, number][] } }> };
    const geometry = data.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(geometry) && geometry.length > 0 ? geometry : null;
  } catch {
    return null;
  }
}

function mergeBounds(regions: Region[]): [[number, number], [number, number]] {
  const [first, ...rest] = regions;
  return rest.reduce<[[number, number], [number, number]]>(
    (bounds, region) => [
      [Math.min(bounds[0][0], region.bounds[0][0]), Math.min(bounds[0][1], region.bounds[0][1])],
      [Math.max(bounds[1][0], region.bounds[1][0]), Math.max(bounds[1][1], region.bounds[1][1])]
    ],
    [
      [first.bounds[0][0], first.bounds[0][1]],
      [first.bounds[1][0], first.bounds[1][1]]
    ]
  );
}

type ExplorerMapProps = {
  initialMapStyleId: MapStyleId;
  initialProtomapsPmtilesUrl: string | null;
};

export function ExplorerMap({ initialMapStyleId, initialProtomapsPmtilesUrl }: ExplorerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const pois = useExplorerStore((state) => state.pois);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const selectedModeIds = useExplorerStore((state) => state.selectedModeIds);
  const explorationModes = useExplorerStore((state) => state.explorationModes);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const regions = useExplorerStore((state) => state.regions);
  const language = useExplorerStore((state) => state.language);
  const zoom = useExplorerStore((state) => state.zoom);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const favorites = useExplorerStore((state) => state.favorites);
  const hideViewedOnMap = useExplorerStore((state) => state.hideViewedOnMap);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const setZoom = useExplorerStore((state) => state.setZoom);
  const userLocation = useExplorerStore((state) => state.userLocation);
  const sortByDistance = useExplorerStore((state) => state.sortByDistance);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const t = getTranslations(language);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);

  const selectedModes = useMemo(
    () => explorationModes.filter((mode) => selectedModeIds.includes(mode.id)),
    [selectedModeIds, explorationModes]
  );

  const activeRegions = useMemo(
    () => regions.filter((region) => activeRegionIds.includes(region.id)),
    [regions, activeRegionIds]
  );

  const regionVoronoiCollection = useMemo(
    () => buildRegionVoronoi(activeRegions, language),
    [activeRegions, language]
  );

  const regionPois = useMemo(
    () => pois.filter((poi) => activeRegionIds.includes(poi.regionId)),
    [pois, activeRegionIds]
  );

  const visiblePois = useMemo(
    () =>
      getVisiblePois(
        regionPois,
        selectedModes,
        zoom,
        searchQuery,
        (poi) => getLocalizedPoiSearchText(poi, language),
        { viewedPoiIds, hideViewed: hideViewedOnMap, nearbyOrigin: sortByDistance ? userLocation : null }
      ),
    [selectedModes, language, regionPois, searchQuery, zoom, viewedPoiIds, hideViewedOnMap, sortByDistance, userLocation]
  );

  const poiCollection = useMemo(
    () => createPoiCollection(visiblePois, selectedPoiId, viewedPoiIds, favorites),
    [selectedPoiId, visiblePois, viewedPoiIds, favorites]
  );

  useEffect(() => {
    let isMounted = true;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const [maplibre, style] = await Promise.all([
        import("maplibre-gl"),
        resolveMapStyle(initialMapStyleId, initialProtomapsPmtilesUrl)
      ]);

      if (!isMounted || !containerRef.current) {
        return;
      }

      const initialState = useExplorerStore.getState();
      const initialRegion = findRegionById(initialState.regions, initialState.activeRegionIds[0]);

      const map = new maplibre.Map({
        container: containerRef.current,
        style,
        center: [initialRegion.center.lng, initialRegion.center.lat],
        zoom: initialRegion.defaultZoom,
        attributionControl: {
          compact: true
        }
      });

      const handlePoiClick = (event: MapLayerMouseEvent) => {
        const poiId = getPoiIdFromEvent(event);

        if (poiId) {
          selectPoiFromMap(poiId);
        }
      };

      const setPointerCursor = () => {
        map.getCanvas().style.cursor = "pointer";
      };

      const resetCursor = () => {
        map.getCanvas().style.cursor = "";
      };

      map.on("zoom", () => setZoom(map.getZoom()));
      map.on("load", () => {
        hideBasemapPoiLayers(map);
        void addPoiLayers(map).then(() => {
          if (!isMounted) {
            return;
          }
          map.on("click", poiHitLayerId, handlePoiClick);
          map.on("mouseenter", poiHitLayerId, setPointerCursor);
          map.on("mouseleave", poiHitLayerId, resetCursor);
          setZoom(map.getZoom());
          setIsMapReady(true);
        });
      });
      mapRef.current = map;
    }

    void mountMap();

    return () => {
      isMounted = false;
      setIsMapReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectPoiFromMap, setZoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    setPoiSourceData(map, poiCollection);
  }, [isMapReady, poiCollection]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    setRegionVoronoiSourceData(map, regionVoronoiCollection);
  }, [isMapReady, regionVoronoiCollection]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    applyBasemapLanguage(map, language);
  }, [isMapReady, language]);

  const regionKey = activeRegions.map((region) => region.id).join(",");
  const prevRegionKeyRef = useRef<string>("");

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    const regionChanged = regionKey !== prevRegionKeyRef.current;
    prevRegionKeyRef.current = regionKey;

    if (regionChanged) {
      if (regionPois.length > 1) {
        map.fitBounds(boundsFromPois(regionPois), { padding: getFitBoundsPadding(), duration: 650, maxZoom: 15 });
      } else if (regionPois.length === 1) {
        map.easeTo({
          center: [regionPois[0].coordinates.lng, regionPois[0].coordinates.lat],
          zoom: activeRegions[0]?.defaultZoom ?? 12,
          duration: 650
        });
      } else if (activeRegions.length > 0) {
        const bounds = activeRegions.length === 1 ? activeRegions[0].bounds : mergeBounds(activeRegions);
        map.fitBounds(bounds, { padding: getFitBoundsPadding(), duration: 650 });
      }
      return;
    }

    const selectedPoi = regionPois.find((poi) => poi.id === selectedPoiId);

    if (!selectedPoi) {
      return;
    }

    map.easeTo({
      center: [selectedPoi.coordinates.lng, selectedPoi.coordinates.lat],
      duration: 650,
      zoom: Math.max(map.getZoom(), 12)
    });
  }, [isMapReady, regionKey, regionPois, selectedPoiId, activeRegions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    let isCancelled = false;

    (async () => {
      const maplibre = await import("maplibre-gl");
      if (isCancelled) return;

      if (!userLocation) {
        userMarkerRef.current?.remove();
        userMarkerRef.current = null;
        return;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
        return;
      }

      const el = document.createElement("div");
      el.className = "h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_0_5px_rgba(59,130,246,0.28)]";

      userMarkerRef.current = new maplibre.Marker({ element: el }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    })();

    return () => {
      isCancelled = true;
    };
  }, [isMapReady, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const stopsInView = (itinerary?.stops ?? []).filter((stop) => activeRegionIds.includes(stop.poi.regionId));

    if (stopsInView.length < 2) {
      setRouteSourceData(map, emptyRouteCollection);
      return;
    }

    let isCancelled = false;
    const straightLine: RouteFeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { approximate: true },
          geometry: {
            type: "LineString",
            coordinates: stopsInView.map((stop) => [stop.poi.coordinates.lng, stop.poi.coordinates.lat])
          }
        }
      ]
    };

    setRouteSourceData(map, straightLine);

    (async () => {
      const routeCoordinates = await fetchWalkingRouteCoordinates(stopsInView.map((stop) => stop.poi.coordinates));
      if (isCancelled || !routeCoordinates) return;

      setRouteSourceData(map, {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { approximate: false },
            geometry: { type: "LineString", coordinates: routeCoordinates }
          }
        ]
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [isMapReady, itinerary, activeRegionIds]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-[402px] top-6 hidden rounded-md border border-white/70 bg-white/[0.82] px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur-xl md:block">
        Zoom {zoom.toFixed(1)} / {visiblePois.length} {t.app.places}
      </div>
      <div className="absolute bottom-5 left-[402px] z-20 flex flex-col overflow-hidden rounded-md border border-white/70 bg-white/[0.82] shadow-soft backdrop-blur-xl">
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
          className="flex h-9 w-9 items-center justify-center text-foreground transition hover:bg-muted/60"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-border" />
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
          className="flex h-9 w-9 items-center justify-center text-foreground transition hover:bg-muted/60"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
