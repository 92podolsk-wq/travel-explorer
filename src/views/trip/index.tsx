"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Download, ExternalLink } from "lucide-react";
import type { Itinerary } from "@/entities/itinerary/model/types";
import { computeItinerarySummary } from "@/entities/itinerary/model/summary";
import {
  stopPointCoordinates,
  stopPointDescription,
  stopPointDurationMinutes,
  stopPointName,
  stopPointPhotoAlt,
  stopPointPhotoUrl
} from "@/entities/itinerary/model/stop-point";
import { buildGoogleMapsUrl } from "@/features/favorites-export/lib/build-google-maps-url";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";

type TripViewProps = {
  itinerary: Itinerary;
  autoPrint?: boolean;
};

export function TripView({ itinerary, autoPrint }: TripViewProps) {
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);
  const mapsUrl = buildGoogleMapsUrl(itinerary.stops.map((stop) => ({ coordinates: stopPointCoordinates(stop.point) })));
  const summary = computeItinerarySummary(itinerary.stops);
  const days = [...new Set(itinerary.stops.map((stop) => stop.day))].sort((a, b) => a - b);

  useEffect(() => {
    if (!autoPrint) return;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [autoPrint]);

  return (
    <main className="min-h-dvh bg-muted">
      <header className="flex h-16 items-center justify-between gap-2.5 border-b border-border bg-card px-5 print:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-icon.png"
            alt="Wayora"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Wayora</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t.trip.sharedRouteLabel}
            </p>
          </div>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">{itinerary.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {itinerary.stops.length} {t.app.places} ·{" "}
          {t.trip.travelTimeSummary
            .replace("{total}", String(summary.totalMinutes))
            .replace("{walking}", String(summary.walkingMinutes))}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/[0.72] px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-card"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.trip.openInGoogleMaps}
            </a>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card/[0.72] px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-card"
          >
            <Download className="h-3.5 w-3.5" />
            {t.auth.downloadPdf}
          </button>
        </div>

        {itinerary.stops.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t.trip.empty}</p>
        ) : (
          <div className="mt-6 flex flex-col gap-6">
            {days.map((day) => (
              <div key={day} className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t.auth.dayLabel.replace("{n}", String(day))}
                </p>
                {itinerary.stops
                  .filter((stop) => stop.day === day)
                  .map((stop, index) => {
                    const photoUrl = stopPointPhotoUrl(stop.point);
                    const name = stopPointName(stop.point, language, t.app.markerStopFallbackName);
                    const description = stopPointDescription(stop.point);
                    return (
                      <div key={stop.id} className="flex gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        {photoUrl && (
                          <Image
                            src={photoUrl}
                            alt={stopPointPhotoAlt(stop.point) ?? name}
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 rounded object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                          {description && (
                            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">{description}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t.trip.stopDurationOnSite.replace(
                              "{minutes}",
                              String(stop.durationOverrideMinutes ?? stopPointDurationMinutes(stop.point))
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
