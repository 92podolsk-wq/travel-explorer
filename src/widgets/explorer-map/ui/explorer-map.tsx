"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, CheckCircle2, Eye, LocateFixed, MapPin, MapPinPlus, Minus, Plus, Sparkles } from "lucide-react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
  Marker as MapLibreMarker
} from "maplibre-gl";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import Supercluster from "supercluster";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { ItineraryStopPoint } from "@/entities/itinerary/model/types";
import { stopPointCoordinates, stopPointRegionId } from "@/entities/itinerary/model/stop-point";
import type { Poi, PoiMainCategory } from "@/entities/poi/model/types";
import { findRegionById } from "@/entities/region/model/regions";
import type { Region } from "@/entities/region/model/types";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { cn } from "@/shared/lib/cn";
import { getCurrentPosition } from "@/shared/lib/geolocate";
import { resolveMapStyle } from "@/shared/map/map-styles";
import { categoryMarkerColors, registerCategoryMarkerIcons } from "@/shared/map/poi-marker-icons";
import { buildRegionVoronoi, emptyRegionVoronoiCollection, type RegionVoronoiCollection } from "@/shared/map/region-voronoi";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { AddMarkerPanel } from "./add-marker-panel";

const poiSourceId = "travel-explorer-pois";
const poiHitLayerId = "poi-hit-area";
const poiCircleLayerId = "poi-circles";
const poiIconLayerId = "poi-icons";
const poiLabelLayerId = "poi-labels";
const poiClusterCircleLayerId = "poi-cluster-circles";
const poiClusterCountLayerId = "poi-cluster-counts";
const routeSourceId = "travel-explorer-itinerary-route";
const routeLayerId = "itinerary-route-line";
const routeApproximateLayerId = "itinerary-route-line-approximate";
const dayBadgeSourceId = "travel-explorer-itinerary-day-badges";
const dayBadgeCircleLayerId = "itinerary-day-badge-circles";
const dayBadgeLabelLayerId = "itinerary-day-badge-labels";
const customMarkerSourceId = "travel-explorer-custom-markers";
const customMarkerHaloLayerId = "custom-marker-halos";
const customMarkerCircleLayerId = "custom-marker-circles";
const customMarkerLabelLayerId = "custom-marker-labels";
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
  category: PoiMainCategory;
};

type PoiFeature = Feature<Point, PoiFeatureProperties>;
type PoiFeatureCollection = FeatureCollection<Point, PoiFeatureProperties>;
type RouteFeatureCollection = FeatureCollection<LineString, { approximate: boolean; day: number; color: string }>;
type DayBadgeFeatureCollection = FeatureCollection<Point, { day: number; color: string }>;
type CustomMarkerFeatureCollection = FeatureCollection<Point, { id: string; color: string; label: string }>;

const emptyPoiCollection: PoiFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const emptyRouteCollection: RouteFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const emptyDayBadgeCollection: DayBadgeFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

const emptyCustomMarkerCollection: CustomMarkerFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

function createCustomMarkerCollection(markers: CustomMarker[]): CustomMarkerFeatureCollection {
  return {
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature",
      properties: { id: marker.id, color: marker.color, label: marker.label },
      geometry: { type: "Point", coordinates: [marker.lng, marker.lat] }
    }))
  };
}

const dayRouteColors = ["#287f72", "#a3312c", "#e0a13e", "#5b6ee1", "#6b5b95"];

function getDayColor(dayIndex: number): string {
  return dayRouteColors[dayIndex % dayRouteColors.length];
}

function pointToLngLat(point: ItineraryStopPoint): [number, number] {
  const coordinates = stopPointCoordinates(point);
  return [coordinates.lng, coordinates.lat];
}

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
          category: poi.category
        }
      })
    )
  };
}

const noExplorationModes: never[] = [];

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
      "line-color": ["get", "color"],
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
      "line-color": ["get", "color"],
      "line-width": 3,
      "line-opacity": 0.75,
      "line-dasharray": [2, 1.5]
    }
  });

  // Clustering is computed ourselves (see poiClusterIndexRef/updatePoiClusterSource) via the
  // supercluster library directly, rather than relying on MapLibre's built-in `cluster: true`
  // GeoJSON-source clustering — that internal implementation was observed to permanently freeze
  // a cluster's tree for a subset of tightly-packed points (they'd never split apart on zoom, no
  // matter how far in), while computing clusters ourselves and feeding plain point/cluster
  // features into an unclustered source does not exhibit this.
  map.addSource(poiSourceId, {
    type: "geojson",
    data: emptyPoiCollection
  });

  map.addLayer({
    id: poiClusterCircleLayerId,
    type: "circle",
    source: poiSourceId,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#287f72",
      "circle-opacity": 0.9,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 24, 30, 28]
    }
  });

  map.addLayer({
    id: poiClusterCountLayerId,
    type: "symbol",
    source: poiSourceId,
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count"],
      "text-size": 13,
      "text-font": ["Noto Sans Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true
    },
    paint: { "text-color": "#ffffff" }
  });

  map.addLayer({
    id: poiHitLayerId,
    type: "circle",
    source: poiSourceId,
    filter: ["!", ["has", "point_count"]],
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
    filter: ["!", ["has", "point_count"]],
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
    filter: ["!", ["has", "point_count"]],
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
    filter: ["!", ["has", "point_count"]],
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

  map.addSource(dayBadgeSourceId, {
    type: "geojson",
    data: emptyDayBadgeCollection
  });

  map.addLayer({
    id: dayBadgeCircleLayerId,
    type: "circle",
    source: dayBadgeSourceId,
    paint: {
      "circle-radius": 10,
      "circle-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
      "circle-translate": [14, -14]
    }
  });

  map.addLayer({
    id: dayBadgeLabelLayerId,
    type: "symbol",
    source: dayBadgeSourceId,
    layout: {
      "text-field": ["get", "day"],
      "text-size": 10,
      "text-font": ["Noto Sans Bold"],
      "text-allow-overlap": true,
      "text-ignore-placement": true
    },
    paint: {
      "text-color": "#ffffff",
      "text-translate": [14, -14]
    }
  });

  map.addSource(customMarkerSourceId, {
    type: "geojson",
    data: emptyCustomMarkerCollection
  });

  map.addLayer({
    id: customMarkerHaloLayerId,
    type: "circle",
    source: customMarkerSourceId,
    paint: {
      "circle-radius": 13,
      "circle-color": ["get", "color"],
      "circle-opacity": 0.25
    }
  });

  map.addLayer({
    id: customMarkerCircleLayerId,
    type: "circle",
    source: customMarkerSourceId,
    paint: {
      "circle-radius": 8,
      "circle-color": ["get", "color"],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff"
    }
  });

  map.addLayer({
    id: customMarkerLabelLayerId,
    type: "symbol",
    source: customMarkerSourceId,
    filter: ["!=", ["get", "label"], ""],
    layout: {
      "text-field": ["get", "label"],
      "text-size": 11,
      "text-anchor": "top",
      "text-offset": [0, 1.1],
      "text-allow-overlap": false
    },
    paint: {
      "text-color": "#23313d",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6
    }
  });
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

/**
 * Rebuilds the poi cluster index from the current poi list. clusterRadius/maxZoom match the
 * values MapLibre's own built-in clustering used to be configured with.
 */
function buildPoiClusterIndex(data: PoiFeatureCollection): Supercluster<PoiFeatureProperties> {
  const index = new Supercluster<PoiFeatureProperties>({ radius: 50, maxZoom: 20 });
  index.load(data.features);
  return index;
}

/** Reads the clusters visible in the map's current viewport out of the index and renders them. */
function updatePoiClusterSource(map: MapLibreMap, index: Supercluster<PoiFeatureProperties>) {
  const bounds = map.getBounds();
  const bbox: [number, number, number, number] = [
    bounds.getWest(),
    bounds.getSouth(),
    bounds.getEast(),
    bounds.getNorth()
  ];
  const zoom = Math.round(map.getZoom());
  const clusters = index.getClusters(bbox, zoom);

  setPoiSourceData(map, { type: "FeatureCollection", features: clusters } as unknown as PoiFeatureCollection);
}

function setRouteSourceData(map: MapLibreMap, data: RouteFeatureCollection) {
  const source = map.getSource(routeSourceId);

  if (!source) {
    return;
  }

  (source as GeoJSONSource).setData(data);
}

function setDayBadgeSourceData(map: MapLibreMap, data: DayBadgeFeatureCollection) {
  const source = map.getSource(dayBadgeSourceId);

  if (!source) {
    return;
  }

  (source as GeoJSONSource).setData(data);
}

function setCustomMarkerSourceData(map: MapLibreMap, data: CustomMarkerFeatureCollection) {
  const source = map.getSource(customMarkerSourceId);

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
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const poiClusterIndexRef = useRef<Supercluster<PoiFeatureProperties> | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const pois = useExplorerStore((state) => state.pois);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const selectedCategories = useExplorerStore((state) => state.selectedCategories);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const regions = useExplorerStore((state) => state.regions);
  const language = useExplorerStore((state) => state.language);
  const zoom = useExplorerStore((state) => state.zoom);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const favorites = useExplorerStore((state) => state.favorites);
  const hideViewedOnMap = useExplorerStore((state) => state.hideViewedOnMap);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const setZoom = useExplorerStore((state) => state.setZoom);
  const userLocation = useExplorerStore((state) => state.userLocation);
  const sortByDistance = useExplorerStore((state) => state.sortByDistance);
  const isLocatingUser = useExplorerStore((state) => state.isLocatingUser);
  const setUserLocation = useExplorerStore((state) => state.setUserLocation);
  const setIsLocatingUser = useExplorerStore((state) => state.setIsLocatingUser);
  const setLocationError = useExplorerStore((state) => state.setLocationError);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const customMarkers = useExplorerStore((state) => state.customMarkers);
  const customMarkerLimit = useExplorerStore((state) => state.customMarkerLimit);
  const isAddingMarker = useExplorerStore((state) => state.isAddingMarker);
  const setIsAddingMarker = useExplorerStore((state) => state.setIsAddingMarker);
  const setIsSwipeOpen = useExplorerStore((state) => state.setIsSwipeOpen);
  const addCustomMarkerToState = useExplorerStore((state) => state.addCustomMarkerToState);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const t = getTranslations(language);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function handleLocateMe() {
    const map = mapRef.current;
    setIsLocatingUser(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      map?.flyTo({ center: [coords.lng, coords.lat], zoom: Math.max(map.getZoom(), 15) });
    } catch {
      setLocationError(t.app.locationError);
    } finally {
      setIsLocatingUser(false);
    }
  }

  function handleToggleAddMarker() {
    if (isAddingMarker) {
      setIsAddingMarker(false);
      setPendingMarkerCoords(null);
    } else {
      setIsAddingMarker(true);
    }
  }

  async function handleSaveMarker(color: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!pendingMarkerCoords) {
      return { ok: false, error: t.app.markerSaveError };
    }

    if (!currentUser) {
      addCustomMarkerToState({
        id: `local-${Date.now()}`,
        lat: pendingMarkerCoords.lat,
        lng: pendingMarkerCoords.lng,
        color,
        label,
        createdAt: new Date().toISOString()
      });
      setIsAddingMarker(false);
      setPendingMarkerCoords(null);
      return { ok: true };
    }

    const res = await fetch("/api/me/custom-markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: pendingMarkerCoords.lat, lng: pendingMarkerCoords.lng, color, label })
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string; limit?: number } | null;
      if (data?.error === "MARKER_LIMIT_REACHED") {
        return { ok: false, error: t.app.markerLimitReached.replace("{limit}", String(data.limit ?? customMarkerLimit)) };
      }
      return { ok: false, error: t.app.markerSaveError };
    }

    const marker = (await res.json()) as CustomMarker;
    addCustomMarkerToState(marker);
    setIsAddingMarker(false);
    setPendingMarkerCoords(null);
    return { ok: true };
  }

  async function handleDeleteMarker(id: string) {
    useExplorerStore.getState().removeCustomMarkerFromState(id);
    if (useExplorerStore.getState().currentUser && !id.startsWith("local-")) {
      await fetch(`/api/me/custom-markers/${id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  async function handleAddMarkerToItineraryClick(customMarkerId: string) {
    const state = useExplorerStore.getState();
    if (!state.currentUser || !state.itinerary) return;
    const res = await fetch(`/api/me/itineraries/${state.itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customMarkerId })
    });
    if (res.ok) useExplorerStore.getState().setItinerary(await res.json());
  }

  async function handleRemoveMarkerStopClick(customMarkerId: string) {
    const state = useExplorerStore.getState();
    if (!state.itinerary) return;
    const stop = state.itinerary.stops.find((s) => s.point.kind === "marker" && s.point.marker.id === customMarkerId);
    if (!stop) return;
    const res = await fetch(`/api/me/itineraries/${state.itinerary.id}/stops/${stop.id}`, { method: "DELETE" });
    if (res.ok) useExplorerStore.getState().setItinerary(await res.json());
  }

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

  const customMarkerCollection = useMemo(() => createCustomMarkerCollection(customMarkers), [customMarkers]);

  const visiblePois = useMemo(
    () =>
      getVisiblePois(
        regionPois,
        noExplorationModes,
        zoom,
        searchQuery,
        (poi) => getLocalizedPoiSearchText(poi, language),
        { viewedPoiIds, hideViewed: hideViewedOnMap, nearbyOrigin: sortByDistance ? userLocation : null, selectedCategories }
      ),
    [
      language,
      regionPois,
      searchQuery,
      zoom,
      viewedPoiIds,
      hideViewedOnMap,
      sortByDistance,
      userLocation,
      selectedCategories
    ]
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

      let hoverPreviewPopup: InstanceType<typeof maplibre.Popup> | null = null;
      let hoveredPreviewPoiId: string | null = null;

      function buildPoiPreviewNode(poi: Poi): HTMLDivElement {
        const node = document.createElement("div");
        node.className = "flex items-center gap-2.5 p-2 pr-3";

        if (poi.photos[0]) {
          const img = document.createElement("img");
          img.src = poi.photos[0].url;
          img.alt = "";
          img.className = "h-12 w-12 shrink-0 rounded-md object-cover";
          node.appendChild(img);
        }

        const info = document.createElement("div");
        info.className = "min-w-0";

        const name = document.createElement("p");
        name.className = "max-w-[11rem] truncate text-sm font-semibold text-foreground";
        name.textContent = poi.nameByLanguage[useExplorerStore.getState().language] ?? poi.name;
        info.appendChild(name);

        const rating = document.createElement("p");
        rating.className = "text-xs text-muted-foreground";
        rating.textContent = `★ ${poi.rating.toFixed(1)}`;
        info.appendChild(rating);

        node.appendChild(info);
        return node;
      }

      const handlePoiHoverMove = (event: MapLayerMouseEvent) => {
        if (useExplorerStore.getState().isAddingMarker) return;

        const poiId = getPoiIdFromEvent(event);
        if (!poiId) return;

        if (poiId === hoveredPreviewPoiId) {
          hoverPreviewPopup?.setLngLat(event.lngLat);
          return;
        }

        const poi = useExplorerStore.getState().pois.find((p) => p.id === poiId);
        if (!poi) return;

        hoveredPreviewPoiId = poiId;
        hoverPreviewPopup?.remove();
        hoverPreviewPopup = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 14 })
          .setLngLat(event.lngLat)
          .setDOMContent(buildPoiPreviewNode(poi))
          .addTo(map);
      };

      const handlePoiHoverLeave = () => {
        hoveredPreviewPoiId = null;
        hoverPreviewPopup?.remove();
        hoverPreviewPopup = null;
      };

      const handleClusterClick = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const index = poiClusterIndexRef.current;
        if (clusterId == null || !index) return;

        const zoom = Math.min(index.getClusterExpansionZoom(clusterId), 20);
        const coordinates = (feature!.geometry as Point).coordinates as [number, number];
        map.easeTo({ center: coordinates, zoom });
      };

      const handleCustomMarkerClick = (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const id = feature.properties?.id as string | undefined;
        const label = (feature.properties?.label as string | undefined) ?? "";
        if (!id) return;
        const coordinates = (feature.geometry as Point).coordinates as [number, number];

        const popupNode = document.createElement("div");
        popupNode.className = "flex flex-col gap-2 p-1";
        if (label) {
          const labelEl = document.createElement("p");
          labelEl.className = "text-sm font-medium text-foreground";
          labelEl.textContent = label;
          popupNode.appendChild(labelEl);
        }

        const markerState = useExplorerStore.getState();
        const isLocalMarker = id.startsWith("local-");
        const existingStop = markerState.itinerary?.stops.find(
          (s) => s.point.kind === "marker" && s.point.marker.id === id
        );

        let itineraryButton: HTMLButtonElement | null = null;
        if (markerState.currentUser && markerState.itinerary && !isLocalMarker) {
          itineraryButton = document.createElement("button");
          itineraryButton.type = "button";
          itineraryButton.className = "text-left text-xs font-semibold text-primary hover:underline";
          itineraryButton.textContent = existingStop ? t.app.removeMarkerFromItinerary : t.app.addMarkerToItinerary;
          popupNode.appendChild(itineraryButton);
        }

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = t.app.markerDeleteLabel;
        deleteButton.className = "text-left text-xs font-semibold text-red-600 hover:underline";
        popupNode.appendChild(deleteButton);

        const popup = new maplibre.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(coordinates)
          .setDOMContent(popupNode)
          .addTo(map);

        itineraryButton?.addEventListener("click", () => {
          if (existingStop) {
            void handleRemoveMarkerStopClick(id);
          } else {
            void handleAddMarkerToItineraryClick(id);
          }
          popup.remove();
        });

        deleteButton.addEventListener("click", () => {
          void handleDeleteMarker(id);
          popup.remove();
        });
      };

      const handleMapClick = (event: MapLayerMouseEvent) => {
        if (!useExplorerStore.getState().isAddingMarker) return;

        const hits = map.queryRenderedFeatures(event.point, {
          layers: [poiHitLayerId, poiClusterCircleLayerId, customMarkerCircleLayerId, customMarkerHaloLayerId]
        });
        if (hits.length > 0) return;

        setPendingMarkerCoords({ lat: event.lngLat.lat, lng: event.lngLat.lng });
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
          map.on("mousemove", poiHitLayerId, handlePoiHoverMove);
          map.on("mouseleave", poiHitLayerId, handlePoiHoverLeave);
          map.on("click", poiClusterCircleLayerId, handleClusterClick);
          map.on("mouseenter", poiClusterCircleLayerId, setPointerCursor);
          map.on("mouseleave", poiClusterCircleLayerId, resetCursor);
          map.on("moveend", () => {
            const index = poiClusterIndexRef.current;
            if (index) {
              updatePoiClusterSource(map, index);
            }
          });
          map.on("click", customMarkerCircleLayerId, handleCustomMarkerClick);
          map.on("mouseenter", customMarkerCircleLayerId, setPointerCursor);
          map.on("mouseleave", customMarkerCircleLayerId, resetCursor);
          map.on("click", handleMapClick);
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

    poiClusterIndexRef.current = buildPoiClusterIndex(poiCollection);
    updatePoiClusterSource(map, poiClusterIndexRef.current);
  }, [isMapReady, poiCollection]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    setCustomMarkerSourceData(map, customMarkerCollection);
  }, [isMapReady, customMarkerCollection]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.getCanvas().style.cursor = isAddingMarker ? "crosshair" : "";
  }, [isAddingMarker]);

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

    const stopsInView = (itinerary?.stops ?? []).filter((stop) => {
      const regionId = stopPointRegionId(stop.point);
      return regionId === null || activeRegionIds.includes(regionId);
    });

    if (stopsInView.length < 2) {
      setRouteSourceData(map, emptyRouteCollection);
      setDayBadgeSourceData(map, emptyDayBadgeCollection);
      return;
    }

    const dayNumbers = Array.from(new Set(stopsInView.map((stop) => stop.day))).sort((a, b) => a - b);
    const dayGroups = dayNumbers.map((day, index) => ({
      day,
      color: getDayColor(index),
      stops: stopsInView.filter((stop) => stop.day === day)
    }));

    setDayBadgeSourceData(
      map,
      dayGroups.length > 1
        ? {
            type: "FeatureCollection",
            features: dayGroups.map((group) => ({
              type: "Feature",
              properties: { day: group.day, color: group.color },
              geometry: {
                type: "Point",
                coordinates: pointToLngLat(group.stops[0].point)
              }
            }))
          }
        : emptyDayBadgeCollection
    );

    let isCancelled = false;
    const dayGroupsWithRoute = dayGroups.filter((group) => group.stops.length >= 2);

    const straightLine: RouteFeatureCollection = {
      type: "FeatureCollection",
      features: dayGroupsWithRoute.map((group) => ({
        type: "Feature",
        properties: { approximate: true, day: group.day, color: group.color },
        geometry: {
          type: "LineString",
          coordinates: group.stops.map((stop) => pointToLngLat(stop.point))
        }
      }))
    };

    setRouteSourceData(map, straightLine);

    (async () => {
      const routesPerDay = await Promise.all(
        dayGroupsWithRoute.map(async (group) => {
          const routeCoordinates = await fetchWalkingRouteCoordinates(
            group.stops.map((stop) => stopPointCoordinates(stop.point))
          );
          return {
            day: group.day,
            color: group.color,
            approximate: !routeCoordinates,
            coordinates: routeCoordinates ?? group.stops.map((stop) => pointToLngLat(stop.point))
          };
        })
      );

      if (isCancelled) return;

      setRouteSourceData(map, {
        type: "FeatureCollection",
        features: routesPerDay.map((route) => ({
          type: "Feature",
          properties: { approximate: route.approximate, day: route.day, color: route.color },
          geometry: { type: "LineString", coordinates: route.coordinates }
        }))
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [isMapReady, itinerary, activeRegionIds]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute left-[402px] top-6 hidden items-center gap-3 rounded-full border border-white/70 bg-white/[0.9] px-4 py-2 text-sm font-semibold text-foreground shadow-soft backdrop-blur-xl md:flex">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
            <MapPin className="h-4 w-4" />
          </span>
          {visiblePois.length} {t.app.places}
        </span>
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={() => router.push("/account?tab=saved")}
          className="flex items-center gap-2 transition hover:text-primary"
        >
          <Bookmark className="h-4 w-4" />
          {favorites.length} {t.app.saved}
        </button>
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={() => router.push("/account?tab=history")}
          className="flex items-center gap-2 transition hover:text-primary"
        >
          <Eye className="h-4 w-4" />
          {viewedPoiIds.length} {t.app.viewed}
        </button>
        <div className="h-5 w-px bg-border" />
        <button
          type="button"
          onClick={() => router.push("/account?tab=history")}
          className="flex items-center gap-2 transition hover:text-primary"
        >
          <CheckCircle2 className="h-4 w-4" />
          {visitedPoiIds.length} {t.app.visited.toLowerCase()}
        </button>
      </div>
      <div className="absolute right-4 top-6 z-20 flex flex-col items-end gap-2 lg:bottom-5 lg:left-[402px] lg:right-auto lg:top-auto lg:items-stretch">
        <button
          type="button"
          onClick={() => setIsSwipeOpen(true)}
          title={t.app.swipeDiscoveryHint}
          className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          {t.app.swipeDiscovery}
        </button>
        <button
          type="button"
          onClick={() => void handleLocateMe()}
          disabled={isLocatingUser}
          aria-label={t.app.locateMeHint}
          title={t.app.locateMeHint}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-panel transition hover:bg-muted/60 disabled:opacity-60"
        >
          <LocateFixed className={cn("h-4 w-4", isLocatingUser && "animate-pulse")} />
        </button>
        <button
          type="button"
          onClick={handleToggleAddMarker}
          aria-pressed={isAddingMarker}
          aria-label={t.app.addMarkerHint}
          title={t.app.addMarkerHint}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full shadow-panel transition",
            isAddingMarker ? "bg-primary/10 text-primary" : "bg-white text-foreground hover:bg-muted/60"
          )}
        >
          <MapPinPlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomIn()}
          aria-label="Zoom in"
          title="Zoom in"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-panel transition hover:bg-muted/60"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.zoomOut()}
          aria-label="Zoom out"
          title="Zoom out"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-panel transition hover:bg-muted/60"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {isAddingMarker && !pendingMarkerCoords && (
        <div className="absolute left-1/2 top-6 z-30 -translate-x-1/2 rounded-full border border-white/70 bg-white/[0.92] px-4 py-2 text-sm font-semibold text-foreground shadow-soft backdrop-blur-xl">
          {t.app.addMarkerModeHint}
        </div>
      )}

      {pendingMarkerCoords && (
        <AddMarkerPanel
          language={language}
          markerCount={customMarkers.length}
          markerLimit={customMarkerLimit}
          onSave={handleSaveMarker}
          onCancel={() => {
            setIsAddingMarker(false);
            setPendingMarkerCoords(null);
          }}
        />
      )}
    </div>
  );
}
