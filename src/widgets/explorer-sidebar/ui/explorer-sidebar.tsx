"use client";

import { useMemo, useState } from "react";
import { Bookmark, Camera, CheckCircle2, Clock, Eye, EyeOff, Search, Star, Sunrise, Sunset } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { seasons } from "@/entities/poi/model/constants";
import { seasonIcons } from "@/entities/poi/ui/season-icon";
import { findRegionById } from "@/entities/region/model/regions";
import { SeasonWeatherStrip } from "./season-weather-strip";
import { explorationModes } from "@/features/exploration-mode/model/modes";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";
import { modeIcons } from "@/features/exploration-mode/ui/mode-icon";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import { getSunTimes } from "@/shared/lib/sun-times";
import { LiveWeatherChips } from "./live-weather-chips";
import { Button } from "@/shared/ui/button";
import { HankoSeal } from "@/shared/ui/hanko-seal";
import { SeigaihaWatermark } from "@/shared/ui/seigaiha-watermark";
import { Input } from "@/shared/ui/input";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

export function ExplorerSidebar() {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const activeRegionId = useExplorerStore((state) => state.activeRegionId);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const activeModeId = useExplorerStore((state) => state.activeModeId);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const hideViewedOnMap = useExplorerStore((state) => state.hideViewedOnMap);
  const toggleHideViewedOnMap = useExplorerStore((state) => state.toggleHideViewedOnMap);
  const hideFavoritesOnMap = useExplorerStore((state) => state.hideFavoritesOnMap);
  const toggleHideFavoritesOnMap = useExplorerStore((state) => state.toggleHideFavoritesOnMap);
  const hideVisitedOnMap = useExplorerStore((state) => state.hideVisitedOnMap);
  const toggleHideVisitedOnMap = useExplorerStore((state) => state.toggleHideVisitedOnMap);
  const language = useExplorerStore((state) => state.language);
  const zoom = useExplorerStore((state) => state.zoom);
  const setActiveMode = useExplorerStore((state) => state.setActiveMode);
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const selectPoi = useExplorerStore((state) => state.selectPoi);
  const selectedSeasons = useExplorerStore((state) => state.selectedSeasons);
  const toggleSeason = useExplorerStore((state) => state.toggleSeason);
  const t = getTranslations(language);
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);

  const activeRegion = findRegionById(regions, activeRegionId);
  const regionPois = pois.filter((poi) => poi.regionId === activeRegionId);

  const activeMode =
    explorationModes.find((mode) => mode.id === activeModeId) ?? explorationModes[0];
  const visiblePois = getVisiblePois(
    regionPois,
    activeMode,
    zoom,
    searchQuery,
    (poi) => getLocalizedPoiSearchText(poi, language),
    {
      viewedPoiIds,
      hideViewed: hideViewedOnMap,
      favoritePoiIds: favorites,
      hideFavorites: hideFavoritesOnMap,
      visitedPoiIds,
      hideVisited: hideVisitedOnMap
    }
  );

  const sunTimes = useMemo(
    () =>
      getSunTimes(
        new Date(),
        activeRegion.center.lat,
        activeRegion.center.lng,
        activeRegion.timezoneOffsetHours
      ),
    [activeRegion]
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute left-5 top-5 z-10 flex h-[calc(100%-2.5rem)] w-[min(370px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-white/70 bg-white/[0.82] shadow-panel backdrop-blur-xl"
    >
      <div className="relative overflow-hidden border-b border-white/70 p-5">
        <SeigaihaWatermark className="-top-8 -right-8" />
        <div
          className="relative mb-3 flex w-fit items-center gap-2.5"
          onMouseEnter={() => setIsGreetingVisible(true)}
          onMouseLeave={() => setIsGreetingVisible(false)}
        >
          <h1 className="cursor-default text-3xl font-semibold tracking-normal">
            {activeRegion.nameByLanguage[language]}
          </h1>
          <HankoSeal character={activeRegion.sealCharacter} />
          <AnimatePresence>
            {isGreetingVisible && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="absolute left-0 top-full z-30 mt-2 whitespace-nowrap rounded-full bg-[#a3312c] px-3.5 py-1.5 text-sm font-semibold text-white shadow-panel"
              >
                {t.app.kyotoGreeting}
                <span className="absolute -top-1 left-6 h-2.5 w-2.5 rotate-45 bg-[#a3312c]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mb-3 h-[3px] w-11 rounded-full bg-[#a3312c]" />

        <div className="mb-3 flex flex-wrap items-center gap-1">
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-white/70 px-1.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="inline-flex items-center gap-0.5" title={t.app.sunrise}>
              <Sunrise className="h-3 w-3 text-amber-500" />
              {sunTimes.sunrise ?? "—"}
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="inline-flex items-center gap-0.5" title={t.app.sunset}>
              <Sunset className="h-3 w-3 text-amber-500" />
              {sunTimes.sunset ?? "—"}
            </span>
          </div>
          <LiveWeatherChips
            key={activeRegion.id}
            regionId={activeRegion.id}
            latitude={activeRegion.center.lat}
            longitude={activeRegion.center.lng}
            timeZoneOffsetHours={activeRegion.timezoneOffsetHours}
            nowLabel={t.app.now}
            tomorrowLabel={t.app.tomorrow}
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={t.app.searchAria}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t.app.searchPlaceholder}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border-b border-white/70 p-4">
        <div className="flex flex-wrap gap-2">
          {explorationModes.map((mode) => {
            const ModeIcon = modeIcons[mode.id as ExplorationModeId];
            const matchCount = regionPois.filter((poi) =>
              poi.tags.some((tag) => mode.tags.includes(tag))
            ).length;

            return (
              <Button
                key={mode.id}
                type="button"
                variant={mode.id === activeModeId ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMode(mode.id as ExplorationModeId)}
                title={t.modes[mode.id].description}
                className={cn(
                  "h-9 max-w-full rounded-md px-3",
                  mode.id === activeModeId ? "shadow-soft" : "bg-white/[0.58]"
                )}
              >
                <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {t.modes[mode.id].label} ({matchCount})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-white/70 p-4 pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t.app.seasonFilter}
        </p>
        <div className="flex gap-2">
          {seasons.map((season) => {
            const SeasonIcon = seasonIcons[season];
            const isActive = selectedSeasons.includes(season);

            return (
              <button
                key={season}
                type="button"
                onClick={() => toggleSeason(season)}
                aria-pressed={isActive}
                title={t.season[season]}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-md border py-1.5 transition",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-white/[0.58] text-muted-foreground hover:text-foreground"
                )}
              >
                <SeasonIcon className="h-4 w-4" />
                <span className="text-[11px] font-medium">{t.season[season]}</span>
              </button>
            );
          })}
        </div>
        <SeasonWeatherStrip
          regionId={activeRegion.id}
          selectedSeasons={selectedSeasons}
          language={language}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center gap-3 px-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {visiblePois.length} {t.app.visible}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className="h-3.5 w-3.5" />
            {favorites.length} {t.app.saved}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleHideViewedOnMap}
              aria-pressed={hideViewedOnMap}
              title={hideViewedOnMap ? t.app.showViewedHint : t.app.hideViewedHint}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded border transition",
                hideViewedOnMap
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {hideViewedOnMap ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleHideFavoritesOnMap}
              aria-pressed={hideFavoritesOnMap}
              title={hideFavoritesOnMap ? t.app.showFavoritesHint : t.app.hideFavoritesHint}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded border transition",
                hideFavoritesOnMap
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleHideVisitedOnMap}
              aria-pressed={hideVisitedOnMap}
              title={hideVisitedOnMap ? t.app.showVisitedHint : t.app.hideVisitedHint}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded border transition",
                hideVisitedOnMap
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {visiblePois.map((poi) => {
            const isSelected = poi.id === selectedPoiId;
            const isFavorite = favorites.includes(poi.id);

            return (
              <button
                key={poi.id}
                type="button"
                onClick={() => selectPoi(poi.id)}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white",
                  isSelected
                    ? "border-primary/[0.35] bg-white shadow-soft"
                    : "border-white/70 bg-white/[0.62]"
                )}
              >
                <div className="flex gap-3">
                  <Image
                    src={poi.photos[0]?.url}
                    alt={poi.photos[0]?.alt ?? poi.name}
                    width={64}
                    height={64}
                    className="h-[72px] w-[72px] rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-[15px] font-semibold">{poi.name}</h2>
                      {isFavorite && <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {t.poi[poi.id]?.description ?? poi.description}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {poi.rating.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Camera className="h-3.5 w-3.5" />
                        {poi.photos.length}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {poi.durationMinutes}
                        {t.app.minutesShort}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
  );
}
