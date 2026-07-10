"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Download, ExternalLink } from "lucide-react";
import type { Itinerary } from "@/entities/itinerary/model/types";
import { computeItinerarySummary } from "@/entities/itinerary/model/summary";
import { buildGoogleMapsUrl } from "@/features/favorites-export/lib/build-google-maps-url";
import { TravelKittenLogo } from "@/shared/ui/travel-kitten-logo";

type TripViewProps = {
  itinerary: Itinerary;
  autoPrint?: boolean;
};

export function TripView({ itinerary, autoPrint }: TripViewProps) {
  const pois = itinerary.stops.map((stop) => stop.poi);
  const summary = computeItinerarySummary(pois);
  const mapsUrl = buildGoogleMapsUrl(pois);
  const days = [...new Set(itinerary.stops.map((stop) => stop.day))].sort((a, b) => a - b);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  return (
    <main className="min-h-dvh bg-muted">
      <header className="flex h-16 items-center gap-2.5 border-b border-border bg-white px-5 print:hidden">
        <TravelKittenLogo className="h-9 w-9" />
        <div>
          <p className="text-sm font-semibold text-foreground">Travel Explorer</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Общий маршрут</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">{itinerary.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pois.length} мест · {summary.totalMinutes} мин в пути (из них {summary.walkingMinutes} мин пешком)
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white/[0.72] px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Открыть маршрут в Google Maps
            </a>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white/[0.72] px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-white"
          >
            <Download className="h-3.5 w-3.5" />
            Скачать PDF
          </button>
        </div>

        {pois.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">В этом маршруте пока нет мест.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {days.map((day) => (
              <div key={day} className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">День {day}</p>
                {itinerary.stops
                  .filter((stop) => stop.day === day)
                  .map((stop, index) => (
                    <div key={stop.id} className="flex gap-3 rounded-lg border border-border bg-white p-3 shadow-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      {stop.poi.photos[0] && (
                        <Image
                          src={stop.poi.photos[0].url}
                          alt={stop.poi.photos[0].alt ?? stop.poi.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{stop.poi.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{stop.poi.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{stop.poi.durationMinutes} мин на месте</p>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
