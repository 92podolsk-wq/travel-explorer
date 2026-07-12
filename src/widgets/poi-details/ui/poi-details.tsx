"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Heart, MapPin, Sparkles, Star, SunMedium, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { seasons } from "@/entities/poi/model/constants";
import { categoryIcons } from "@/entities/poi/ui/category-icon";
import { difficultyIcons } from "@/entities/poi/ui/difficulty-icon";
import { seasonIcons } from "@/entities/poi/ui/season-icon";
import { getTranslations } from "@/shared/i18n/translations";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";
import { looksTranslated } from "@/shared/lib/translation-completeness";
import { ReportInaccuracyModal } from "./report-inaccuracy-modal";

export function PoiDetails() {
  const pois = useExplorerStore((state) => state.pois);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const favorites = useExplorerStore((state) => state.favorites);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const language = useExplorerStore((state) => state.language);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const toggleVisited = useExplorerStore((state) => state.toggleVisited);
  const selectedSeasons = useExplorerStore((state) => state.selectedSeasons);
  const toggleSeason = useExplorerStore((state) => state.toggleSeason);
  const isDetailsOpen = useExplorerStore((state) => state.isDetailsOpen);
  const setDetailsOpen = useExplorerStore((state) => state.setDetailsOpen);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);
  const t = getTranslations(language);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const regionPois = pois.filter((poi) => activeRegionIds.includes(poi.regionId));

  useEffect(() => {
    if (isDetailsOpen && selectedPoi) {
      markPoiViewed(selectedPoi.id);
    }
  }, [isDetailsOpen, selectedPoi, markPoiViewed]);

  useEffect(() => {
    setActivePhotoIndex(0);
    setIsReportOpen(false);
  }, [selectedPoiId, selectedSeasons]);

  if (!selectedPoi) {
    return null;
  }

  const isFavorite = favorites.includes(selectedPoi.id);
  const isVisited = visitedPoiIds.includes(selectedPoi.id);
  const poiName = selectedPoi.nameByLanguage[language] ?? selectedPoi.name;
  const poiCopy = t.poi[selectedPoi.id];
  const bestTime = poiCopy?.bestTime ?? selectedPoi.bestTime;
  const localizedDescription = selectedPoi.descriptionByLanguage[language];
  const description =
    language === "ru"
      ? localizedDescription
      : looksTranslated(language, localizedDescription)
        ? localizedDescription
        : (poiCopy?.description ?? selectedPoi.description);
  const DifficultyIcon = difficultyIcons[selectedPoi.difficulty];

  const seasonFilteredPhotos =
    selectedSeasons.length === 0
      ? selectedPoi.photos
      : selectedPoi.photos.filter((photo) => !photo.season || selectedSeasons.includes(photo.season));
  const displayPhotos = seasonFilteredPhotos.length > 0 ? seasonFilteredPhotos : selectedPoi.photos;
  const hasSeasonSpecificMatch =
    selectedSeasons.length > 0 &&
    selectedPoi.photos.some((photo) => photo.season && selectedSeasons.includes(photo.season));
  const showSeasonFallbackHint = selectedSeasons.length > 0 && !hasSeasonSpecificMatch;
  const activePhoto = displayPhotos[activePhotoIndex] ?? displayPhotos[0];

  const currentIndex = regionPois.findIndex((poi) => poi.id === selectedPoi.id);
  const hasMultiplePlaces = regionPois.length > 1 && currentIndex !== -1;

  function goToOffset(offset: number) {
    if (!hasMultiplePlaces) {
      return;
    }

    const nextIndex = (currentIndex + offset + regionPois.length) % regionPois.length;
    selectPoiFromMap(regionPois[nextIndex].id);
  }

  return (
    <div
      className={cn(
        "z-20 lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-5 lg:top-5 lg:z-10 lg:block lg:h-[calc(100%-2.5rem)] lg:w-[400px]",
        isDetailsOpen ? "fixed inset-x-0 bottom-0 h-[85dvh]" : "hidden"
      )}
    >
      {isDetailsOpen && (
        <button
          type="button"
          aria-label={t.app.hideDetails}
          onClick={() => setDetailsOpen(false)}
          className="fixed inset-0 z-10 bg-black/20 lg:hidden"
        />
      )}

      <motion.button
        type="button"
        aria-label={isDetailsOpen ? t.app.hideDetails : t.app.showDetails}
        onClick={() => setDetailsOpen(!isDetailsOpen)}
        initial={false}
        animate={{ right: isDetailsOpen ? "392px" : "-10px" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "absolute top-1/2 z-20 hidden h-16 w-9 -translate-y-1/2 items-center justify-center rounded-l-full border text-primary shadow-panel backdrop-blur-xl transition-colors hover:bg-muted lg:flex",
          isDetailsOpen ? "border-white/70 bg-white/90" : "border-white bg-white"
        )}
      >
        {isDetailsOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </motion.button>

      <AnimatePresence>
        {isDetailsOpen && (
          <motion.section
            key={selectedPoi.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-t-2xl border border-white/70 bg-white/[0.96] shadow-panel backdrop-blur-xl lg:rounded-lg lg:bg-white/[0.84]"
          >
          <button
            type="button"
            aria-label={t.app.hideDetails}
            onClick={() => setDetailsOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative m-3 h-64 shrink-0 overflow-hidden rounded-lg">
            {activePhoto ? (
              <Image
                key={activePhoto.id}
                src={activePhoto.url}
                alt={activePhoto.alt ?? poiName}
                width={760}
                height={448}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                <MapPin className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/[0.22] to-transparent" />
            {activePhoto?.author && (
              <span className="absolute bottom-1.5 right-3 text-[10px] font-medium text-white/70">
                © {activePhoto.author}
              </span>
            )}
            {displayPhotos.length > 1 && (
              <div className="absolute left-4 top-14 flex gap-1.5">
                {displayPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    aria-label={`${t.app.photo} ${index + 1}`}
                    onClick={() => setActivePhotoIndex(index)}
                    className={cn(
                      "h-9 w-9 overflow-hidden rounded-md border-2 shadow-sm transition",
                      index === activePhotoIndex
                        ? "border-white"
                        : "border-white/40 opacity-80 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <div className="absolute left-4 top-4 flex gap-2">
              {selectedPoi.mustVisit && (
                <Badge className="gap-1 border-white/70 bg-white/[0.88] text-foreground">
                  <Sparkles className="h-3 w-3" />
                  {t.app.mustVisit}
                </Badge>
              )}
              <Badge className="gap-1 border-white/70 bg-white/[0.88] text-foreground">
                <Camera className="h-3 w-3" />
                {t.app.photo} {selectedPoi.photos.length}
              </Badge>
            </div>
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <h2 className="text-3xl font-semibold tracking-normal">{poiName}</h2>
              <div className="mt-2 flex items-center gap-3 text-sm font-medium">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.18] px-2 py-1 backdrop-blur">
                  <Star className="h-4 w-4 fill-white" />
                  {selectedPoi.rating.toFixed(1)}
                </span>
                <span className="rounded-md bg-white/[0.18] px-2 py-1 backdrop-blur">
                  {t.difficulty[selectedPoi.difficulty]}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 px-5">
            <div className="flex gap-1.5">
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
                      "flex h-7 flex-1 items-center justify-center gap-1 rounded border transition",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <SeasonIcon className="h-3 w-3" />
                    <span className="text-[10px] font-medium">{t.season[season]}</span>
                  </button>
                );
              })}
            </div>
            {showSeasonFallbackHint && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">{t.app.noSeasonPhotoHint}</p>
            )}
          </div>

          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-5 pt-2">
            <div className="mb-5 flex gap-2">
              <Button
                type="button"
                variant={isFavorite ? "default" : "outline"}
                onClick={() => toggleFavorite(selectedPoi.id)}
                className="h-11 flex-1"
              >
                <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                {t.app.save}
              </Button>
              <Button
                type="button"
                variant={isVisited ? "default" : "outline"}
                onClick={() => toggleVisited(selectedPoi.id)}
                className="h-11 flex-1"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t.app.visited}
              </Button>
            </div>

            <p className="text-[15px] leading-7 text-muted-foreground">{description}</p>

            <div className="mt-6 grid grid-cols-3 gap-2.5">
              <Metric
                icon={<SunMedium className="h-4 w-4" />}
                label={t.app.best}
                value={bestTime[0] ?? ""}
              />
              <Metric
                icon={<Clock className="h-4 w-4" />}
                label={t.app.duration}
                value={`${selectedPoi.durationMinutes}${t.app.minutesShort}`}
              />
              <Metric
                icon={<DifficultyIcon className="h-4 w-4" />}
                label={t.app.effort}
                value={t.difficulty[selectedPoi.difficulty]}
              />
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">{t.app.bestTime}</h3>
              <div className="flex flex-wrap gap-2">
                {bestTime.map((time) => (
                  <Badge key={time}>{time}</Badge>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold">{t.app.signals}</h3>
              <div className="flex flex-wrap gap-2">
                {selectedPoi.categories.map((category) => {
                  const CategoryIcon = categoryIcons[category];
                  if (!CategoryIcon) return null;
                  return (
                    <Badge key={category} className="gap-1">
                      <CategoryIcon className="h-3 w-3" />
                      {t.category[category] ?? category}
                    </Badge>
                  );
                })}
                {selectedPoi.tags.map((tag) => (
                  <Badge key={tag}>{t.tag[tag]}</Badge>
                ))}
              </div>
            </div>
          </div>

          {hasMultiplePlaces && (
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-t border-white/70 px-5 py-3"
              style={{ paddingBottom: currentUser ? undefined : "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={() => goToOffset(-1)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                {t.app.previousPlace}
              </button>
              <button
                type="button"
                onClick={() => goToOffset(1)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              >
                {t.app.nextPlace}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {currentUser && (
            <div
              className="shrink-0 border-t border-white/70 px-5 py-3"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t.report.cta}
              </button>
            </div>
          )}
          </motion.section>
        )}
      </AnimatePresence>

      {isReportOpen && (
        <ReportInaccuracyModal poiId={selectedPoi.id} language={language} onClose={() => setIsReportOpen(false)} />
      )}
    </div>
  );
}

type MetricProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function Metric({ icon, label, value }: MetricProps) {
  return (
    <div className="rounded-md border border-white/70 bg-white/[0.58] p-3 shadow-sm">
      <div className="mb-2 text-primary">{icon}</div>
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
