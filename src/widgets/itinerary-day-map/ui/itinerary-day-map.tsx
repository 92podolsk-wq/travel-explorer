"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { ItineraryStopPoint } from "@/entities/itinerary/model/types";
import { stopPointColor, stopPointCoordinates } from "@/entities/itinerary/model/stop-point";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { resolveMapStyle } from "@/shared/map/map-styles";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

const routeSourceId = "itinerary-day-route";
const routeLayerId = "itinerary-day-route-line";

type ItineraryDayMapProps = {
  stops: ItineraryStopPoint[];
  lineCoordinates: [number, number][] | null;
  mapStyleId: MapStyleId;
  protomapsPmtilesUrl: string | null;
  heightClassName?: string;
};

function buildNumberedMarkerEl(index: number, color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "22px";
  el.style.height = "22px";
  el.style.borderRadius = "9999px";
  el.style.backgroundColor = color;
  el.style.border = "2px solid #ffffff";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.35)";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.color = "#ffffff";
  el.style.fontSize = "11px";
  el.style.fontWeight = "700";
  el.textContent = String(index);
  return el;
}

function boundsFromCoordinates(coordinates: [number, number][]): [[number, number], [number, number]] {
  const lngs = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

export function ItineraryDayMap({
  stops,
  lineCoordinates,
  mapStyleId,
  protomapsPmtilesUrl,
  heightClassName = "h-64"
}: ItineraryDayMapProps) {
  const categories = useExplorerStore((state) => state.categories);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const initialStyleRef = useRef({ mapStyleId, protomapsPmtilesUrl });

  useEffect(() => {
    let isMounted = true;

    async function mountMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const [maplibre, style] = await Promise.all([
        import("maplibre-gl"),
        resolveMapStyle(initialStyleRef.current.mapStyleId, initialStyleRef.current.protomapsPmtilesUrl)
      ]);

      if (!isMounted || !containerRef.current) {
        return;
      }

      const map = new maplibre.Map({
        container: containerRef.current,
        style,
        center: [135.7681, 35.0116],
        zoom: 12,
        attributionControl: { compact: true }
      });

      map.on("load", () => {
        if (!isMounted) return;
        map.addSource(routeSourceId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } }
        });
        map.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeSourceId,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#287f72", "line-width": 3, "line-opacity": 0.8 }
        });
        setIsMapReady(true);
      });

      mapRef.current = map;
    }

    void mountMap();

    return () => {
      isMounted = false;
      setIsMapReady(false);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (stops.length === 0) {
      return;
    }

    void import("maplibre-gl").then((maplibre) => {
      if (mapRef.current !== map) return;

      stops.forEach((point, index) => {
        const color =
          point.kind === "poi"
            ? (categories.find((category) => category.id === point.poi.category)?.color ?? "#7a7a7a")
            : (stopPointColor(point) ?? "#7a7a7a");
        const coordinates = stopPointCoordinates(point);
        const marker = new maplibre.Marker({ element: buildNumberedMarkerEl(index + 1, color) })
          .setLngLat([coordinates.lng, coordinates.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      const source = map.getSource(routeSourceId);
      if (source) {
        (source as GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: lineCoordinates ?? [] }
        });
      }

      const boundsCoordinates =
        lineCoordinates && lineCoordinates.length > 0
          ? lineCoordinates
          : stops.map((point): [number, number] => {
              const coordinates = stopPointCoordinates(point);
              return [coordinates.lng, coordinates.lat];
            });

      if (boundsCoordinates.length === 1) {
        map.easeTo({ center: boundsCoordinates[0], zoom: 14, duration: 0 });
      } else if (boundsCoordinates.length > 1) {
        map.fitBounds(boundsFromCoordinates(boundsCoordinates), { padding: 32, maxZoom: 16, duration: 0 });
      }
    });
  }, [isMapReady, stops, lineCoordinates, categories]);

  return <div ref={containerRef} className={cn("w-full overflow-hidden rounded-md border border-border", heightClassName)} />;
}
