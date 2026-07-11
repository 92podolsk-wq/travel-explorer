"use client";

import { useMemo, useState } from "react";
import { Bookmark, Camera, CheckCircle2, ChevronDown, Clock, Eye, EyeOff, Layers, LocateFixed, Search, Star, Sunrise, Sunset, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { seasons } from "@/entities/poi/model/constants";
import { seasonIcons } from "@/entities/poi/ui/season-icon";
import { findRegionById } from "@/entities/region/model/regions";
import { SeasonWeatherStrip } from "./season-weather-strip";
import { getModeIcon } from "@/features/exploration-mode/ui/mode-icon";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import { formatDistance, haversineDistanceMeters } from "@/shared/lib/geo";
import { getCurrentPosition } from "@/shared/lib/geolocate";
import { getUpcomingSeasonReminder } from "@/shared/lib/season-reminder";
import { getSunTimes } from "@/shared/lib/sun-times";
import { LiveWeatherChips } from "./live-weather-chips";
import { SwipeDiscoveryModal } from "@/widgets/swipe-discovery/ui/swipe-discovery-modal";
import { Button } from "@/shared/ui/button";
import { CityIcon } from "@/shared/ui/city-icon";
import { SeigaihaWatermark } from "@/shared/ui/seigaiha-watermark";
import { Input } from "@/shared/ui/input";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

export function ExplorerSidebar() {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const areas = useExplorerStore((state) => state.areas);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const selectedModeIds = useExplorerStore((state) => state.selectedModeIds);
  const explorationModes = useExplorerStore((state) => state.explorationModes);
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
  const toggleModeFilter = useExplorerStore((state) => state.toggleModeFilter);
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const selectPoi = useExplorerStore((state) => state.selectPoiFromMap);
  const selectedSeasons = useExplorerStore((state) => state.selectedSeasons);
  const toggleSeason = useExplorerStore((state) => state.toggleSeason);
  const userLocation = useExplorerStore((state) => state.userLocation);
  const isLocatingUser = useExplorerStore((state) => state.isLocatingUser);
  const locationError = useExplorerStore((state) => state.locationError);
  const sortByDistance = useExplorerStore((state) => state.sortByDistance);
  const setUserLocation = useExplorerStore((state) => state.setUserLocation);
  const setIsLocatingUser = useExplorerStore((state) => state.setIsLocatingUser);
  const setLocationError = useExplorerStore((state) => state.setLocationError);
  const setSortByDistance = useExplorerStore((state) => state.setSortByDistance);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const t = getTranslations(language);
  const [isGreetingVisible, setIsGreetingVisible] = useState(false);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [isModeFilterOpen, setIsModeFilterOpen] = useState(false);

  async function handleNearMeClick() {
    if (sortByDistance) {
      setSortByDistance(false);
      return;
    }
    if (userLocation) {
      setSortByDistance(true);
      return;
    }
    setIsLocatingUser(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      setUserLocation(coords);
      setSortByDistance(true);
    } catch {
      setLocationError(t.app.locationError);
    } finally {
      setIsLocatingUser(false);
    }
  }

  const activeRegion = findRegionById(regions, activeRegionIds[0]);
  const regionPois = pois.filter((poi) => activeRegionIds.includes(poi.regionId));
  const swipeCandidates = regionPois.filter((poi) => !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id));
  const isAreaActive = activeRegionIds.length > 1;
  const activeArea = areas.find((area) => area.id === activeRegion.areaId);
  const headingText =
    isAreaActive && activeArea ? activeArea.nameByLanguage[language] : activeRegion.nameByLanguage[language];

  const seasonReminder = !isAreaActive ? getUpcomingSeasonReminder(activeRegion.seasonWindows) : null;
  const reminderKey = seasonReminder ? `${activeRegion.id}:${seasonReminder.season}` : null;
  const showSeasonReminder = seasonReminder && reminderKey && !dismissedReminders.has(reminderKey);

  const selectedModes = explorationModes.filter((mode) => selectedModeIds.includes(mode.id));
  const visiblePois = getVisiblePois(
    regionPois,
    selectedModes,
    zoom,
    searchQuery,
    (poi) => getLocalizedPoiSearchText(poi, language),
    {
      viewedPoiIds,
      hideViewed: hideViewedOnMap,
      favoritePoiIds: favorites,
      hideFavorites: hideFavoritesOnMap,
      visitedPoiIds,
      hideVisited: hideVisitedOnMap,
      nearbyOrigin: sortByDistance ? userLocation : null
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
    <>
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-2xl border-t border-white/70 bg-white/[0.92] shadow-panel backdrop-blur-xl transition-[height] duration-300 ease-out",
        isMobileSheetExpanded ? "h-[85dvh]" : "h-[236px]",
        "lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-5 lg:top-5 lg:h-[calc(100%-2.5rem)] lg:w-[min(370px,calc(100vw-2.5rem))] lg:rounded-lg lg:border lg:transition-none"
      )}
    >
      <button
        type="button"
        onClick={() => setIsMobileSheetExpanded((value) => !value)}
        aria-label={isMobileSheetExpanded ? t.app.hideDetails : t.app.showDetails}
        className="flex w-full shrink-0 flex-col items-center gap-1 pb-1 pt-2.5 lg:hidden"
      >
        <span className="h-1 w-9 rounded-full bg-border" />
      </button>

      <div className="relative shrink-0 overflow-hidden border-b border-white/70 p-5">
        <SeigaihaWatermark className="-top-8 -right-8" />
        <div
          className="relative mb-3 flex w-fit items-center gap-2.5"
          onMouseEnter={() => setIsGreetingVisible(true)}
          onMouseLeave={() => setIsGreetingVisible(false)}
        >
          <h1 className="cursor-default text-3xl font-semibold tracking-normal">
            {headingText}
          </h1>
          <CityIcon regionId={activeRegion.id} sealCharacter={activeRegion.sealCharacter} />
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

        {showSeasonReminder && seasonReminder && reminderKey && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
            {(() => {
              const SeasonIcon = seasonIcons[seasonReminder.season];
              return <SeasonIcon className="h-3.5 w-3.5 shrink-0" />;
            })()}
            <span className="flex-1">
              {(seasonReminder.daysUntil === 0 ? t.app.seasonReminderToday : t.app.seasonReminder)
                .replace("{season}", t.season[seasonReminder.season])
                .replace("{city}", headingText)
                .replace("{days}", String(seasonReminder.daysUntil))}
            </span>
            <button
              type="button"
              onClick={() => setDismissedReminders((prev) => new Set(prev).add(reminderKey))}
              aria-label={t.report.close}
              className="shrink-0 text-primary/70 transition hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={t.app.searchAria}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t.app.searchPlaceholder}
              className="pl-9"
            />
          </div>
          <button
            type="button"
            onClick={handleNearMeClick}
            disabled={isLocatingUser}
            aria-pressed={sortByDistance}
            title={t.app.nearMeHint}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition disabled:opacity-60",
              sortByDistance
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-white text-muted-foreground hover:text-foreground"
            )}
          >
            <LocateFixed className={cn("h-4 w-4", isLocatingUser && "animate-pulse")} />
          </button>
          <button
            type="button"
            onClick={() => setIsSwipeOpen(true)}
            disabled={swipeCandidates.length === 0}
            title={t.app.swipeDiscoveryHint}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-white text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
        {locationError && <p className="mt-1.5 text-[11px] text-red-600">{locationError}</p>}
      </div>

      <div className="hidden shrink-0 border-b border-white/70 sm:block">
        <button
          type="button"
          onClick={() => setIsModeFilterOpen((value) => !value)}
          aria-expanded={isModeFilterOpen}
          className="flex w-full items-center justify-between gap-2 p-4 pb-3 text-left"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t.app.modeFilters}
            {selectedModeIds.length > 0 && (
              <span className="ml-1.5 text-primary">({selectedModeIds.length})</span>
            )}
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isModeFilterOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>
        {isModeFilterOpen && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {explorationModes.map((mode) => {
              const ModeIcon = getModeIcon(mode.icon);
              const isSelected = selectedModeIds.includes(mode.id);
              const matchCount = regionPois.filter((poi) =>
                poi.tags.some((tag) => mode.tags.includes(tag))
              ).length;

              return (
                <Button
                  key={mode.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleModeFilter(mode.id)}
                  aria-pressed={isSelected}
                  title={mode.descriptionByLanguage[language] ?? mode.description}
                  className={cn("h-9 max-w-full rounded-md px-3", isSelected ? "shadow-soft" : "bg-white/[0.58]")}
                >
                  <ModeIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {mode.nameByLanguage[language] ?? mode.name} ({matchCount})
                  </span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-b border-white/70 p-4 pt-3">
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

      <div
        className="min-h-0 flex-1 overflow-y-auto p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
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
                    alt={poi.photos[0]?.alt ?? poi.nameByLanguage[language] ?? poi.name}
                    width={64}
                    height={64}
                    className="h-[72px] w-[72px] rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-[15px] font-semibold">{poi.nameByLanguage[language] ?? poi.name}</h2>
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
                      {sortByDistance && userLocation && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <LocateFixed className="h-3.5 w-3.5" />
                          {formatDistance(haversineDistanceMeters(userLocation, poi.coordinates))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.aside>
    {isSwipeOpen && (
      <SwipeDiscoveryModal
        pois={swipeCandidates}
        language={language}
        onLike={toggleFavorite}
        onSkip={markPoiViewed}
        onClose={() => setIsSwipeOpen(false)}
      />
    )}
    </>
  );
}
