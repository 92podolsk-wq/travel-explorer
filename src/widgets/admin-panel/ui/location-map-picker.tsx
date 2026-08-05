"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import { Loader2, MapPin, Search } from "lucide-react";
import { defaultMapStyleUrl } from "@/shared/map/map-styles";
import { searchPlaces, type GeocodeBounds, type GeocodeResult } from "@/shared/lib/admin-geocode";
import { Input } from "@/shared/ui/input";

type LocationMapPickerProps = {
  lat: string;
  lng: string;
  onChange: (lat: number, lng: number) => void;
  fallbackCenter: { lat: number; lng: number };
  fallbackZoom?: number;
  onCaptureBounds?: (bounds: GeocodeBounds) => void;
};

export function LocationMapPicker({
  lat,
  lng,
  onChange,
  fallbackCenter,
  fallbackZoom = 13,
  onCaptureBounds
}: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

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

      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      const hasValidPoint = !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);
      const center: [number, number] = hasValidPoint
        ? [parsedLng, parsedLat]
        : [fallbackCenter.lng, fallbackCenter.lat];

      const map = new maplibre.Map({
        container: containerRef.current,
        style: defaultMapStyleUrl,
        center,
        zoom: hasValidPoint ? 15 : fallbackZoom,
        attributionControl: { compact: true }
      });
      map.addControl(new maplibre.NavigationControl(), "top-right");

      const marker = new maplibre.Marker({ draggable: true, color: "#a3312c" }).setLngLat(center).addTo(map);
      marker.on("dragend", () => {
        const position = marker.getLngLat();
        onChangeRef.current(position.lat, position.lng);
      });

      map.on("click", (event) => {
        marker.setLngLat(event.lngLat);
        onChangeRef.current(event.lngLat.lat, event.lngLat.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    }

    void mountMap();

    return () => {
      isMounted = false;
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng) || !markerRef.current) {
      return;
    }

    markerRef.current.setLngLat([parsedLng, parsedLat]);
  }, [lat, lng]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const found = await searchPlaces(query.trim());
        setResults(found);
        setIsResultsOpen(true);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Не удалось найти место.");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(timeout);
  }, [query]);

  const handlePickResult = (result: GeocodeResult) => {
    setIsResultsOpen(false);
    setQuery(result.label);
    onChangeRef.current(result.lat, result.lng);
    markerRef.current?.setLngLat([result.lng, result.lat]);

    if (result.bounds) {
      mapRef.current?.fitBounds(
        [
          [result.bounds.swLng, result.bounds.swLat],
          [result.bounds.neLng, result.bounds.neLat]
        ],
        { padding: 20, duration: 800 }
      );
      onCaptureBounds?.(result.bounds);
    } else {
      mapRef.current?.flyTo({ center: [result.lng, result.lat], zoom: 16 });
    }
  };

  const handleCaptureBounds = () => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds || !onCaptureBounds) return;
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    onCaptureBounds({ swLat: sw.lat, swLng: sw.lng, neLat: ne.lat, neLng: ne.lng });
  };

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsResultsOpen(true)}
          placeholder="Поиск места по названию или адресу"
          className="pl-9"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {isResultsOpen && results.length > 0 && (
          <>
            <button
              type="button"
              aria-label="Закрыть результаты поиска"
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setIsResultsOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-white shadow-panel">
              {results.map((result, index) => (
                <button
                  key={`${result.lat}-${result.lng}-${index}`}
                  type="button"
                  onClick={() => handlePickResult(result)}
                  className="flex w-full items-start gap-2 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{result.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {searchError && <p className="mt-1 text-xs font-medium text-red-600">{searchError}</p>}
      <div ref={containerRef} className="mt-2 h-64 w-full overflow-hidden rounded-md border border-border" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Найдите место через поиск, кликните по карте или перетащите маркер, чтобы точно указать точку.
      </p>
      {onCaptureBounds && (
        <button
          type="button"
          onClick={handleCaptureBounds}
          className="mt-2 rounded-md border border-border bg-white px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-muted"
          title="Приблизьте или отдалите карту так, чтобы видимая область охватывала нужный город, затем нажмите — границы заполнятся автоматически."
        >
          Взять текущий вид карты как границы
        </button>
      )}
    </div>
  );
}
