"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Camera, CheckCircle2, CheckSquare, ChevronDown, Clock, Eye, EyeOff, Heart, LocateFixed, MapPin, PanelLeftClose, PanelLeftOpen, Search, Square, Star, Sunrise, Sunset } from "lucide-react";
import { AnimatePresence, animate as animateValue, motion, useDragControls, useMotionValue } from "framer-motion";
import Image from "next/image";
import { getCategoryIcon } from "@/entities/poi/ui/category-icon";
import { findRegionById } from "@/entities/region/model/regions";
import { buildAffinityProfile, computeAffinityScore, hasEnoughSignal, topAffinityCategories } from "@/features/recommendations/model/affinity";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import { formatDistance, haversineDistanceMeters } from "@/shared/lib/geo";
import { getCurrentPosition } from "@/shared/lib/geolocate";
import { shuffle } from "@/shared/lib/shuffle";
import { getSunTimes } from "@/shared/lib/sun-times";
import { localizedPoiDescription } from "@/shared/lib/translation-completeness";
import { LiveWeatherChips } from "./live-weather-chips";
import { SwipeDiscoveryModal } from "@/widgets/swipe-discovery/ui/swipe-discovery-modal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

const noExplorationModes: never[] = [];

export function ExplorerSidebar() {
  const pois = useExplorerStore((state) => state.pois);
  const categories = useExplorerStore((state) => state.categories);
  const regions = useExplorerStore((state) => state.regions);
  const areas = useExplorerStore((state) => state.areas);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const selectedCategories = useExplorerStore((state) => state.selectedCategories);
  const toggleCategory = useExplorerStore((state) => state.toggleCategory);
  const selectAllCategories = useExplorerStore((state) => state.selectAllCategories);
  const clearAllCategories = useExplorerStore((state) => state.clearAllCategories);
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
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const selectPoi = useExplorerStore((state) => state.selectPoiFromMap);
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
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const isSwipeOpen = useExplorerStore((state) => state.isSwipeOpen);
  const setIsSwipeOpen = useExplorerStore((state) => state.setIsSwipeOpen);
  const isMobileSheetExpanded = useExplorerStore((state) => state.isMobileSheetExpanded);
  const setIsMobileSheetExpanded = useExplorerStore((state) => state.setIsMobileSheetExpanded);
  const isSidebarCollapsed = useExplorerStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useExplorerStore((state) => state.toggleSidebarCollapsed);
  const t = getTranslations(language);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const collapsedSheetHeight = 236;
  const [collapsedOffset, setCollapsedOffset] = useState(0);
  const sheetY = useMotionValue(0);
  const sheetX = useMotionValue(0);
  const sheetDragControls = useDragControls();

  useEffect(() => {
    function measure() {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setCollapsedOffset(0);
        return;
      }
      const expandedPx = window.innerHeight * 0.85;
      setCollapsedOffset(Math.max(expandedPx - collapsedSheetHeight, 0));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const controls = animateValue(sheetY, isMobileSheetExpanded ? 0 : collapsedOffset, {
      type: "spring",
      damping: 32,
      stiffness: 320
    });
    return () => controls.stop();
  }, [isMobileSheetExpanded, collapsedOffset, sheetY]);

  useEffect(() => {
    const target = isDesktop && isSidebarCollapsed ? -440 : 0;
    const controls = animateValue(sheetX, target, {
      type: "spring",
      damping: 32,
      stiffness: 320
    });
    return () => controls.stop();
  }, [isDesktop, isSidebarCollapsed, sheetX]);

  function handleSheetDragEnd(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
    const current = sheetY.get();
    const projected = current + info.velocity.y * 0.15;
    setIsMobileSheetExpanded(projected < collapsedOffset / 2);
  }

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
  const headerPhoto = useMemo(
    () => [...regionPois].filter((poi) => poi.photos.length > 0).sort((a, b) => b.importance - a.importance)[0]?.photos[0] ?? null,
    [regionPois]
  );
  const likedPois = pois.filter((poi) => favorites.includes(poi.id));
  const affinityProfile = buildAffinityProfile(likedPois);
  const hasAffinitySignal = hasEnoughSignal(affinityProfile);
  const unswipedRegionPois = regionPois.filter(
    (poi) => !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id) && selectedCategories.includes(poi.category)
  );
  const swipeCandidates = hasAffinitySignal
    ? [...unswipedRegionPois].sort((a, b) => computeAffinityScore(b, affinityProfile) - computeAffinityScore(a, affinityProfile))
    : shuffle(unswipedRegionPois);
  const affinityCategoryLabels = hasAffinitySignal
    ? topAffinityCategories(affinityProfile).map(
        (categoryId) => categories.find((category) => category.id === categoryId)?.nameByLanguage[language] ?? categoryId
      )
    : [];
  const activeCountryId = areas.find((area) => area.id === activeRegion.areaId)?.countryId;
  const neighboringSwipeRegions = activeCountryId
    ? regions
        .filter((region) => region.status === "published" && !activeRegionIds.includes(region.id))
        .filter((region) => areas.find((area) => area.id === region.areaId)?.countryId === activeCountryId)
        .map((region) => ({
          id: region.id,
          name: region.nameByLanguage[language] ?? region.name,
          distance: haversineDistanceMeters(activeRegion.center, region.center),
          count: pois.filter(
            (poi) => poi.regionId === region.id && !favorites.includes(poi.id) && !viewedPoiIds.includes(poi.id)
          ).length
        }))
        .filter((region) => region.count > 0)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];
  const isAreaActive = activeRegionIds.length > 1;
  const activeArea = areas.find((area) => area.id === activeRegion.areaId);
  const headingText =
    isAreaActive && activeArea ? activeArea.nameByLanguage[language] : activeRegion.nameByLanguage[language];

  const visiblePois = getVisiblePois(
    regionPois,
    noExplorationModes,
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
      nearbyOrigin: sortByDistance ? userLocation : null,
      selectedCategories
    }
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategories.length < categories.length ||
    hideViewedOnMap ||
    hideFavoritesOnMap ||
    hideVisitedOnMap;

  const handleResetFilters = () => {
    setSearchQuery("");
    selectAllCategories();
    if (hideViewedOnMap) toggleHideViewedOnMap();
    if (hideFavoritesOnMap) toggleHideFavoritesOnMap();
    if (hideVisitedOnMap) toggleHideVisitedOnMap();
  };

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
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ x: sheetX, y: sheetY }}
      drag="y"
      dragListener={false}
      dragControls={sheetDragControls}
      dragConstraints={{ top: 0, bottom: collapsedOffset }}
      dragElastic={0.06}
      onDragEnd={handleSheetDragEnd}
      className={cn(
        "fixed inset-x-0 bottom-0 z-10 flex h-[85dvh] flex-col overflow-hidden rounded-t-2xl border-t border-border/70 bg-card/[0.92] shadow-panel backdrop-blur-xl",
        "lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-5 lg:top-5 lg:h-[calc(100%-2.5rem)] lg:w-[min(370px,calc(100vw-2.5rem))] lg:rounded-lg lg:border",
        isSidebarCollapsed && "lg:pointer-events-none"
      )}
    >
      <button
        type="button"
        onPointerDown={(event) => sheetDragControls.start(event)}
        onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
        aria-label={isMobileSheetExpanded ? t.app.hideDetails : t.app.showDetails}
        className="flex w-full shrink-0 touch-none flex-col items-center gap-1 pb-1 pt-2.5 lg:hidden"
      >
        <span className="h-1 w-9 rounded-full bg-border" />
      </button>

      <div className="relative shrink-0 overflow-hidden border-b border-border/70 p-5">
        {headerPhoto && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headerPhoto.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background/90" />
          </>
        )}
        <div className="relative mb-3 flex w-fit items-center gap-2.5">
          <h1 className="cursor-default text-3xl font-semibold tracking-normal">
            {headingText}
          </h1>
        </div>

        <div className="mb-3 h-[3px] w-11 rounded-full bg-[#a3312c]" />

        <div className="relative mb-3 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1">
            <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
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
          </div>
          <div className="flex flex-wrap items-center gap-1">
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
        </div>

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
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <LocateFixed className={cn("h-4 w-4", isLocatingUser && "animate-pulse")} />
          </button>
        </div>
        {locationError && <p className="mt-1.5 text-[11px] text-red-600">{locationError}</p>}
      </div>

      <div className="hidden shrink-0 border-b border-border/70 sm:block">
        <div className="flex w-full items-center justify-between gap-2 p-4 pb-3">
          <button
            type="button"
            onClick={() => setIsCategoryFilterOpen((value) => !value)}
            aria-expanded={isCategoryFilterOpen}
            className="flex flex-1 items-center justify-between gap-2 text-left"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t.app.categoryFilter}
              {selectedCategories.length < categories.length && (
                <span className="ml-1.5 text-primary">({selectedCategories.length})</span>
              )}
            </span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isCategoryFilterOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={selectAllCategories}
              disabled={selectedCategories.length === categories.length}
              title={t.app.categorySelectAll}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:text-foreground disabled:opacity-30"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={clearAllCategories}
              disabled={selectedCategories.length === 0}
              title={t.app.categoryClearAll}
              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:text-foreground disabled:opacity-30"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {isCategoryFilterOpen && (
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {categories.map((category) => {
              const CategoryIcon = getCategoryIcon(categories, category.id);
              const isSelected = selectedCategories.includes(category.id);

              return (
                <Button
                  key={category.id}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  aria-pressed={isSelected}
                  className={cn("h-9 max-w-full rounded-md px-3", isSelected ? "shadow-soft" : "bg-card/[0.58]")}
                >
                  <CategoryIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{category.nameByLanguage[language] ?? category.name}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain p-4"
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

        {visiblePois.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">{t.app.noResultsTitle}</p>
            <p className="text-xs text-muted-foreground">{t.app.noResultsHint}</p>
            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="mt-1">
                {t.app.resetFilters}
              </Button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {visiblePois.map((poi, index) => {
            const isSelected = poi.id === selectedPoiId;
            const isFavorite = favorites.includes(poi.id);

            return (
              <motion.button
                key={poi.id}
                type="button"
                onClick={() => selectPoi(poi.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card",
                  isSelected
                    ? "border-primary/[0.35] bg-card shadow-soft"
                    : "border-border/70 bg-card/[0.62]"
                )}
              >
                <div className="flex gap-3">
                  {poi.photos[0]?.url ? (
                    <Image
                      src={poi.photos[0].url}
                      alt={poi.photos[0].alt ?? poi.nameByLanguage[language] ?? poi.name}
                      width={64}
                      height={64}
                      className="h-[72px] w-[72px] rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="truncate text-[15px] font-semibold">{poi.nameByLanguage[language] ?? poi.name}</h2>
                      {isFavorite && <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {localizedPoiDescription(poi.descriptionByLanguage, poi.description, language, t.poi[poi.id]?.description)}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2.5 text-xs font-medium text-muted-foreground">
                      {poi.favoritesCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-foreground">
                          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
                          {poi.favoritesCount}
                        </span>
                      )}
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
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.aside>
    {!isSidebarCollapsed && (
      <button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={t.app.collapseSidebar}
        title={t.app.collapseSidebar}
        className="absolute left-[390px] top-6 z-20 hidden h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-soft transition hover:text-foreground lg:flex"
      >
        <PanelLeftClose className="h-3.5 w-3.5" />
      </button>
    )}
    {isSidebarCollapsed && (
      <motion.button
        type="button"
        onClick={toggleSidebarCollapsed}
        aria-label={t.app.expandSidebar}
        title={t.app.expandSidebar}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute left-5 top-5 z-10 hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/[0.92] text-muted-foreground shadow-panel backdrop-blur-xl transition hover:text-foreground lg:flex"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </motion.button>
    )}
    {isSwipeOpen && (
      <SwipeDiscoveryModal
        key={activeRegionIds.join(",")}
        pois={swipeCandidates}
        language={language}
        onLike={toggleFavorite}
        onSkip={markPoiViewed}
        onClose={() => setIsSwipeOpen(false)}
        neighboringRegions={neighboringSwipeRegions}
        onSwitchRegion={setActiveRegion}
        affinityCategories={affinityCategoryLabels}
      />
    )}
    </>
  );
}
