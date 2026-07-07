"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { Poi, PoiCategory } from "@/entities/poi/model/types";
import { findRegionById } from "@/entities/region/model/regions";
import { explorationModes } from "@/features/exploration-mode/model/modes";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { baseMapStyleUrl } from "@/shared/map/base-map-style";
import { categoryMarkerColors, registerCategoryMarkerIcons } from "@/shared/map/poi-marker-icons";
import { useExplorerStore } from "@/shared/model/explorer-store";

const poiSourceId = "travel-explorer-pois";
const poiHitLayerId = "poi-hit-area";
const poiCircleLayerId = "poi-circles";
const poiIconLayerId = "poi-icons";
const poiLabelLayerId = "poi-labels";

type PoiFeatureProperties = {
  id: string;
  name: string;
  selected: boolean;
  mustVisit: boolean;
  viewed: boolean;
  category: PoiCategory;
};

type PoiFeature = Feature<Point, PoiFeatureProperties>;
type PoiFeatureCollection = FeatureCollection<Point, PoiFeatureProperties>;

const emptyPoiCollection: PoiFeatureCollection = {
  type: "FeatureCollection",
  features: []
};

function createPoiCollection(
  pois: Poi[],
  selectedPoiId: string,
  viewedPoiIds: string[]
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
        ["==", ["get", "viewed"], true],
        "#b0b0a8",
        categoryColorMatchExpression
      ],
      "circle-stroke-color": [
        "case",
        ["==", ["get", "selected"], true],
        "#1d5c52",
        "#ffffff"
      ],
      "circle-stroke-width": [
        "case",
        ["==", ["get", "selected"], true],
        4.5,
        3
      ],
      "circle-opacity": [
        "case",
        ["==", ["get", "selected"], true],
        1,
        ["==", ["get", "viewed"], true],
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
        ["==", ["get", "viewed"], true],
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
      "text-color": ["case", ["==", ["get", "viewed"], true], "#9a9a92", "#23313d"],
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6
    }
  });
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
    if (layer.type !== "symbol" || layer.source === poiSourceId) {
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

export function ExplorerMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const pois = useExplorerStore((state) => state.pois);
  const activeRegionId = useExplorerStore((state) => state.activeRegionId);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const activeModeId = useExplorerStore((state) => state.activeModeId);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const regions = useExplorerStore((state) => state.regions);
  const language = useExplorerStore((state) => state.language);
  const zoom = useExplorerStore((state) => state.zoom);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const hideViewedOnMap = useExplorerStore((state) => state.hideViewedOnMap);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const setZoom = useExplorerStore((state) => state.setZoom);
  const t = getTranslations(language);

  const activeMode = useMemo(
    () => explorationModes.find((mode) => mode.id === activeModeId) ?? explorationModes[0],
    [activeModeId]
  );

  const activeRegion = useMemo(
    () => findRegionById(regions, activeRegionId),
    [regions, activeRegionId]
  );

  const regionPois = useMemo(
    () => pois.filter((poi) => poi.regionId === activeRegionId),
    [pois, activeRegionId]
  );

  const visiblePois = useMemo(
    () =>
      getVisiblePois(
        regionPois,
        activeMode,
        zoom,
        searchQuery,
        (poi) => getLocalizedPoiSearchText(poi, language),
        { viewedPoiIds, hideViewed: hideViewedOnMap }
      ),
    [activeMode, language, regionPois, searchQuery, zoom, viewedPoiIds, hideViewedOnMap]
  );

  const poiCollection = useMemo(
    () => createPoiCollection(visiblePois, selectedPoiId, viewedPoiIds),
    [selectedPoiId, visiblePois, viewedPoiIds]
  );

  useEffect(() => {
    let isMounted = true;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const maplibre = await import("maplibre-gl");

      if (!isMounted || !containerRef.current) {
        return;
      }

      const initialState = useExplorerStore.getState();
      const initialRegion = findRegionById(initialState.regions, initialState.activeRegionId);

      const map = new maplibre.Map({
        container: containerRef.current,
        style: baseMapStyleUrl,
        center: [initialRegion.center.lng, initialRegion.center.lat],
        zoom: initialRegion.defaultZoom,
        maxBounds: initialRegion.bounds,
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

      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-right");
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
  }, [selectPoiFromMap, setZoom]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    map.setMaxBounds(undefined);
    map.setMaxBounds(activeRegion.bounds);
  }, [isMapReady, activeRegion]);

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

    applyBasemapLanguage(map, language);
  }, [isMapReady, language]);

  useEffect(() => {
    const selectedPoi = regionPois.find((poi) => poi.id === selectedPoiId);
    const map = mapRef.current;

    if (!selectedPoi || !map) {
      return;
    }

    map.easeTo({
      center: [selectedPoi.coordinates.lng, selectedPoi.coordinates.lat],
      duration: 650,
      zoom: Math.max(map.getZoom(), 12)
    });
  }, [regionPois, selectedPoiId]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-[402px] top-6 hidden rounded-md border border-white/70 bg-white/[0.82] px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur-xl md:block">
        Zoom {zoom.toFixed(1)} / {visiblePois.length} {t.app.places}
      </div>
    </div>
  );
}
