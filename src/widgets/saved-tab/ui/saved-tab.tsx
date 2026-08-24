"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, ChevronDown, ChevronRight, Info, ListPlus, Map as MapIcon, MapPin, Route, Share2, Sparkles, Trash2 } from "lucide-react";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { PoiRow } from "@/entities/poi/ui/poi-row";
import { getTranslations } from "@/shared/i18n/translations";
import { cn } from "@/shared/lib/cn";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useItineraryStopMutations } from "@/shared/model/use-itinerary-stop-mutations";
import { useShareItinerary } from "@/shared/model/use-share-itinerary";
import { Button } from "@/shared/ui/button";
import { FavoritesMap } from "@/widgets/favorites-map/ui/favorites-map";

const FAVORITES_TRIP_HOURS_PER_DAY = 6;

// itinerary/goToMap/onGenerateItinerary/siteSettings are still owned by the
// route tab (inline in AccountPage until that tab gets its own split) —
// threaded through as props rather than duplicated here. requestClear
// likewise stays a prop since the confirm-clear dialog is shared 3-way with
// the route/history tabs.
export function SavedTab({
  isActive,
  requestClear,
  goToPoi,
  goToMap,
  onGenerateItinerary,
  siteSettings
}: {
  isActive: boolean;
  requestClear: (kind: "saved") => void;
  goToPoi: (poiId: string) => void;
  goToMap: () => void;
  onGenerateItinerary: () => void;
  siteSettings: SiteSettings;
}) {
  const language = useExplorerStore((state) => state.language);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const favorites = useExplorerStore((state) => state.favorites);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const itinerary = useExplorerStore((state) => state.itinerary);

  const { itineraryPoiIds, handleAddToItinerary, handleAddAllToItinerary, handleAddRegionToItinerary, handleRemovePoiFromItinerary } =
    useItineraryStopMutations();
  const { handleShareItinerary, isLinkCopied } = useShareItinerary();

  const [collapsedFavoriteRegionIds, setCollapsedFavoriteRegionIds] = useState<Set<string>>(new Set());

  const t = getTranslations(language).auth;

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  function toggleFavoriteRegionCollapsed(regionId: string) {
    setCollapsedFavoriteRegionIds((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  }

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
  const favoritesByRegion = regions
    .map((region) => ({ regionId: region.id, pois: favoritePois.filter((poi) => poi.regionId === region.id) }))
    .filter((group) => group.pois.length > 0);
  const favoritesTotalMinutes = favoritePois.reduce((sum, poi) => sum + poi.durationMinutes, 0);
  const favoritesTripDays =
    favoritePois.length > 0 ? Math.max(1, Math.ceil(favoritesTotalMinutes / (FAVORITES_TRIP_HOURS_PER_DAY * 60))) : 0;
  const favoritesRegionProgress = favoritesByRegion.map(({ regionId, pois: regionPois }) => {
    const totalInRegion = pois.filter((poi) => poi.regionId === regionId).length;
    const percent = totalInRegion > 0 ? Math.round((regionPois.length / totalInRegion) * 100) : 0;
    return { regionId, count: regionPois.length, percent };
  });

  return (
    <section className={cn("flex flex-col gap-3", !isActive && "hidden")}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Bookmark className="h-4 w-4 text-primary" />
          {t.savedPlaces}
        </h2>
        {favoritePois.length > 0 && (
          <div className="flex items-center gap-3">
            {favoritePois.some((poi) => !itineraryPoiIds.has(poi.id)) && (
              <button
                type="button"
                onClick={handleAddAllToItinerary}
                className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              >
                {t.addAllToItinerary}
              </button>
            )}
            <button
              type="button"
              onClick={() => requestClear("saved")}
              className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t.clearSaved}
            </button>
          </div>
        )}
      </div>
      {favoritePois.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/[0.78] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Bookmark className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xl font-bold text-foreground">{favoritePois.length}</div>
                  <div className="text-xs text-muted-foreground">{t.favoritesStatsSaved}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
                  <MapIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xl font-bold text-foreground">{favoritesByRegion.length}</div>
                  <div className="text-xs text-muted-foreground">{t.favoritesStatsRegions}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                  <Route className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xl font-bold text-foreground">
                    {favoritesTripDays}{" "}
                    <span className="text-xs font-normal text-muted-foreground">{t.favoritesStatsDaysUnit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {t.favoritesStatsDays}
                    <span title={t.favoritesStatsDaysHint.replace("{hoursPerDay}", String(FAVORITES_TRIP_HOURS_PER_DAY))}>
                      <Info className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3 sm:max-w-xs">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-foreground">{t.favoritesCtaTitle}</div>
                <div className="text-muted-foreground">{t.favoritesCtaBody.replace("{days}", String(favoritesTripDays))}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {itinerary && itinerary.stops.length > 0 && (
                  <button
                    type="button"
                    onClick={handleShareItinerary}
                    title={isLinkCopied ? t.linkCopied : t.shareItinerary}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}
                <Button type="button" size="sm" onClick={onGenerateItinerary}>
                  {t.favoritesCtaButton}
                </Button>
              </div>
            </div>
          </div>

          {favoritesRegionProgress.length > 0 && (
            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card/[0.78] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {t.favoritesProgressTitle}
                </h3>
                <button
                  type="button"
                  onClick={goToMap}
                  className="flex items-center gap-0.5 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                >
                  {t.favoritesProgressViewAll}
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {favoritesRegionProgress.map(({ regionId, count, percent }) => (
                  <div key={regionId} className="flex items-center gap-3 text-xs">
                    <span className="w-16 shrink-0 truncate font-medium text-foreground">{regionName(regionId)}</span>
                    <span className="w-14 shrink-0 text-muted-foreground">
                      {count} {t.favoritesProgressPlacesUnit}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    <span className="w-9 shrink-0 text-right text-muted-foreground">{percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FavoritesMap
            pois={favoritePois}
            mapStyleId={siteSettings.mapStyleId}
            protomapsPmtilesUrl={siteSettings.protomapsPmtilesUrl}
            onSelectPoi={goToPoi}
            onOpenFullMap={goToMap}
            openMapLabel={t.favoritesMapOpen}
          />
        </div>
      )}
      {favoritePois.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noSavedPlaces}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {favoritesByRegion.map(({ regionId, pois: regionPois }) => {
            const isCollapsed = collapsedFavoriteRegionIds.has(regionId);
            const hasAddable = regionPois.some((poi) => !itineraryPoiIds.has(poi.id));
            return (
              <div key={regionId} className="flex flex-col gap-2 rounded-lg border border-border bg-card/[0.62] p-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavoriteRegionCollapsed(regionId)}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-semibold text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{regionName(regionId)}</span>
                    <span className="shrink-0 text-xs font-normal text-muted-foreground">({regionPois.length})</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        !isCollapsed && "rotate-180"
                      )}
                    />
                  </button>
                  {hasAddable && (
                    <button
                      type="button"
                      onClick={() => handleAddRegionToItinerary(regionId)}
                      title={t.addRegionToItinerary}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:text-primary"
                    >
                      <ListPlus className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col gap-2">
                    {regionPois.map((poi, index) => {
                      const isInItinerary = itineraryPoiIds.has(poi.id);
                      return (
                        <motion.div
                          key={poi.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
                        >
                          <PoiRow
                            poi={poi}
                            regionName={regionName(poi.regionId)}
                            onSelect={() => goToPoi(poi.id)}
                            action={
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    isInItinerary ? handleRemovePoiFromItinerary(poi.id) : handleAddToItinerary(poi.id)
                                  }
                                  className={cn(
                                    "shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
                                    isInItinerary
                                      ? "border-primary/40 bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {isInItinerary ? t.inItinerary : t.addToItinerary}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(poi.id)}
                                  title={t.removeFromFavorites}
                                  className="rounded-md p-1.5 text-muted-foreground transition hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            }
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
