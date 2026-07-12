"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2 } from "lucide-react";
import type { Map as MapLibreMap, MapGeoJSONFeature } from "maplibre-gl";
import type { Poi } from "@/entities/poi/model/types";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { resolveMapStyle } from "@/shared/map/map-styles";
import { cn } from "@/shared/lib/cn";

const sourceId = "favorites-clusters";
const clusterLayerId = "favorites-cluster-circles";
const clusterCountLayerId = "favorites-cluster-counts";
const pointLayerId = "favorites-unclustered-points";
const brandColor = "#287f72";

type FavoritesMapProps = {
  pois: Poi[];
  mapStyleId: MapStyleId;
  protomapsPmtilesUrl: string | null;
  onSelectPoi: (poiId: string) => void;
  onOpenFullMap: () => void;
  openMapLabel: string;
  heightClassName?: string;
};

function boundsFromCoordinates(coordinates: [number, number][]): [[number, number], [number, number]] {
  const lngs = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)]
  ];
}

function buildGeoJson(pois: Poi[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: pois.map((poi) => ({
      type: "Feature",
      properties: { poiId: poi.id },
      geometry: { type: "Point", coordinates: [poi.coordinates.lng, poi.coordinates.lat] }
    }))
  };
}

export function FavoritesMap({
  pois,
  mapStyleId,
  protomapsPmtilesUrl,
  onSelectPoi,
  onOpenFullMap,
  openMapLabel,
  heightClassName = "h-72"
}: FavoritesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
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
        zoom: 10,
        attributionControl: { compact: true }
      });

      map.on("load", () => {
        if (!isMounted) return;

        map.addSource(sourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        map.addLayer({
          id: clusterLayerId,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": brandColor,
            "circle-opacity": 0.9,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
            "circle-radius": ["step", ["get", "point_count"], 15, 5, 19, 15, 23]
          }
        });

        map.addLayer({
          id: clusterCountLayerId,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count"],
            "text-size": 12,
            "text-font": ["Noto Sans Bold"],
            "text-allow-overlap": true
          },
          paint: { "text-color": "#ffffff" }
        });

        map.addLayer({
          id: pointLayerId,
          type: "circle",
          source: sourceId,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": brandColor,
            "circle-radius": 8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
          }
        });

        map.on("mouseenter", clusterLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", clusterLayerId, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("mouseenter", pointLayerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", pointLayerId, () => {
          map.getCanvas().style.cursor = "";
        });

        map.on("click", clusterLayerId, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] }) as MapGeoJSONFeature[];
          const clusterId = features[0]?.properties?.cluster_id;
          const source = map.getSource(sourceId);
          if (clusterId == null || !source || !("getClusterExpansionZoom" in source)) return;
          (source as unknown as { getClusterExpansionZoom: (id: number, cb: (err: unknown, zoom: number) => void) => void }).getClusterExpansionZoom(
            clusterId,
            (err, zoom) => {
              if (err) return;
              const coordinates = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
              map.easeTo({ center: coordinates, zoom });
            }
          );
        });

        map.on("click", pointLayerId, (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [pointLayerId] }) as MapGeoJSONFeature[];
          const poiId = features[0]?.properties?.poiId;
          if (typeof poiId === "string") {
            onSelectPoi(poiId);
          }
        });

        setIsMapReady(true);
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) {
      return;
    }

    const source = map.getSource(sourceId);
    if (!source) return;
    (source as unknown as { setData: (data: GeoJSON.FeatureCollection<GeoJSON.Point>) => void }).setData(buildGeoJson(pois));

    if (pois.length === 0) return;

    const coordinates = pois.map((poi): [number, number] => [poi.coordinates.lng, poi.coordinates.lat]);
    if (coordinates.length === 1) {
      map.easeTo({ center: coordinates[0], zoom: 13, duration: 0 });
    } else {
      map.fitBounds(boundsFromCoordinates(coordinates), { padding: 36, maxZoom: 15, duration: 0 });
    }
  }, [isMapReady, pois]);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-lg border border-border", heightClassName)}>
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        onClick={onOpenFullMap}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        {openMapLabel}
      </button>
    </div>
  );
}
