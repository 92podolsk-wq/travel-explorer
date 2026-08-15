"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Heart, ImagePlus, MapPin, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { difficultyIcons } from "@/entities/poi/ui/difficulty-icon";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";
import { hapticMedium } from "@/shared/lib/haptics";
import { localizedPoiDescription } from "@/shared/lib/translation-completeness";
import { ReportInaccuracyModal } from "./report-inaccuracy-modal";
import { UploadPhotoModal } from "./upload-photo-modal";

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
  const isDetailsOpen = useExplorerStore((state) => state.isDetailsOpen);
  const setDetailsOpen = useExplorerStore((state) => state.setDetailsOpen);
  const markPoiViewed = useExplorerStore((state) => state.markPoiViewed);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const selectedPoi = pois.find((poi) => poi.id === selectedPoiId);
  const t = getTranslations(language);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isUploadPhotoOpen, setIsUploadPhotoOpen] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  const regionPois = pois.filter((poi) => activeRegionIds.includes(poi.regionId));

  useEffect(() => {
    if (isDetailsOpen && selectedPoi) {
      markPoiViewed(selectedPoi.id);
    }
  }, [isDetailsOpen, selectedPoi, markPoiViewed]);

  useEffect(() => {
    setActivePhotoIndex(0);
    setIsReportOpen(false);
    setIsPhotoViewerOpen(false);
  }, [selectedPoiId, selectedSeasons]);

  const seasonFilteredPhotos =
    selectedSeasons.length === 0
      ? (selectedPoi?.photos ?? [])
      : (selectedPoi?.photos ?? []).filter((photo) => !photo.season || selectedSeasons.includes(photo.season));
  const displayPhotos = seasonFilteredPhotos.length > 0 ? seasonFilteredPhotos : (selectedPoi?.photos ?? []);

  // Auto-advances the hero photo like an Instagram Story — 6s per photo,
  // looping back to the first — mirroring the native app's PoiDetailSheet.
  // Pauses while the fullscreen photo viewer is open.
  useEffect(() => {
    if (!isDetailsOpen || isPhotoViewerOpen || displayPhotos.length <= 1) return;
    const timer = setTimeout(() => {
      setActivePhotoIndex((current) => (current + 1) % displayPhotos.length);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isDetailsOpen, isPhotoViewerOpen, displayPhotos.length, activePhotoIndex]);

  function goToPhotoOffset(offset: number) {
    if (displayPhotos.length === 0) return;
    setActivePhotoIndex((current) => (current + offset + displayPhotos.length) % displayPhotos.length);
  }

  if (!selectedPoi) {
    return null;
  }

  const isFavorite = favorites.includes(selectedPoi.id);
  const isVisited = visitedPoiIds.includes(selectedPoi.id);
  const poiName = selectedPoi.nameByLanguage[language] ?? selectedPoi.name;

  const handleShare = async () => {
    const url = `${window.location.origin}/?poi=${selectedPoi.id}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: poiName, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setIsLinkCopied(true);
      setTimeout(() => setIsLinkCopied(false), 2000);
    } catch {
      // Clipboard unavailable; nothing more we can do silently.
    }
  }
  const poiCopy = t.poi[selectedPoi.id];
  const description = localizedPoiDescription(
    selectedPoi.descriptionByLanguage,
    selectedPoi.description,
    language,
    poiCopy?.description
  );
  const DifficultyIcon = difficultyIcons[selectedPoi.difficulty];
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
            className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-t-2xl border border-border bg-card/[0.96] shadow-panel backdrop-blur-xl lg:rounded-lg lg:bg-card/[0.84]"
          >
          <button
            type="button"
            aria-label={t.app.hideDetails}
            onClick={() => setDetailsOpen(false)}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative h-64 shrink-0 overflow-hidden">
            {activePhoto ? (
              <button
                type="button"
                aria-label={`${t.app.photo} ${activePhotoIndex + 1}`}
                onClick={() => setIsPhotoViewerOpen(true)}
                className="block h-full w-full cursor-zoom-in"
              >
                <Image
                  key={activePhoto.id}
                  src={activePhoto.url}
                  alt={activePhoto.alt ?? poiName}
                  width={760}
                  height={448}
                  className="h-full w-full object-cover"
                />
              </button>
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
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-normal">{poiName}</h2>
                {selectedPoi.favoritesCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.18] px-2 py-1 text-sm font-medium backdrop-blur">
                    <Heart className="h-4 w-4 fill-white" />
                    {selectedPoi.favoritesCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
            <div className="mb-4 flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <DifficultyIcon className="h-4 w-4 text-primary" />
                {t.difficulty[selectedPoi.difficulty]}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {selectedPoi.durationMinutes}
                {t.app.minutesShort}
              </span>
              <span className="h-3 w-px bg-border" />
              <span className="inline-flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-primary" />
                {selectedPoi.photos.length} {t.app.photo}
              </span>
            </div>

            <p className="text-[15px] leading-7 text-muted-foreground">{description}</p>

            <div className="mb-1 mt-5 flex gap-2">
              <Button
                type="button"
                variant={isFavorite ? "default" : "outline"}
                onClick={() => {
                  void hapticMedium();
                  toggleFavorite(selectedPoi.id);
                }}
                className="h-11 flex-1 rounded-full"
              >
                <motion.span
                  key={String(isFavorite)}
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="inline-flex"
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </motion.span>
                {t.app.save}
              </Button>
              <Button
                type="button"
                variant={isVisited ? "default" : "outline"}
                onClick={() => toggleVisited(selectedPoi.id)}
                className="h-11 flex-1 rounded-full"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t.app.visited}
              </Button>
            </div>
          </div>

          {hasMultiplePlaces && (
            <div
              className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-5 py-3"
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

          <div
            className="flex shrink-0 items-center gap-4 border-t border-border px-5 py-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Share2 className="h-3.5 w-3.5" />
              {isLinkCopied ? t.app.linkCopied : t.app.share}
            </button>
            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => setIsUploadPhotoOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  {t.photoUpload.cta}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {t.report.cta}
                </button>
              </>
            )}
          </div>
          </motion.section>
        )}
      </AnimatePresence>

      {isReportOpen && (
        <ReportInaccuracyModal poiId={selectedPoi.id} language={language} onClose={() => setIsReportOpen(false)} />
      )}

      {isUploadPhotoOpen && (
        <UploadPhotoModal poiId={selectedPoi.id} language={language} onClose={() => setIsUploadPhotoOpen(false)} />
      )}

      {isPhotoViewerOpen && activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            type="button"
            aria-label={t.report.close}
            className="absolute inset-0"
            onClick={() => setIsPhotoViewerOpen(false)}
          />
          <button
            type="button"
            aria-label={t.report.close}
            onClick={() => setIsPhotoViewerOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {displayPhotos.length > 1 && (
            <>
              <button
                type="button"
                aria-label={`${t.app.photo} ${((activePhotoIndex - 1 + displayPhotos.length) % displayPhotos.length) + 1}`}
                onClick={() => goToPhotoOffset(-1)}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label={`${t.app.photo} ${((activePhotoIndex + 1) % displayPhotos.length) + 1}`}
                onClick={() => goToPhotoOffset(1)}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="relative z-0 flex max-h-[88vh] max-w-[92vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              key={activePhoto.id}
              src={activePhoto.url}
              alt={activePhoto.alt ?? poiName}
              width={1400}
              height={1400}
              className="max-h-[88vh] w-auto max-w-full rounded-md object-contain"
            />
            {activePhoto.author && (
              <span className="absolute bottom-2 right-2 text-xs font-medium text-white/70">
                © {activePhoto.author}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
