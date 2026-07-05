"use client";

import { MapPin, Search, Star } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { explorationModes } from "@/features/exploration-mode/model/modes";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";
import { getVisiblePois } from "@/features/smart-map/model/visibility";
import { getLocalizedPoiSearchText, getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

const languageOptions: Array<{ language: Language; label: string }> = [
  { language: "en", label: "EN" },
  { language: "ru", label: "RU" }
];

export function ExplorerSidebar() {
  const pois = useExplorerStore((state) => state.pois);
  const selectedPoiId = useExplorerStore((state) => state.selectedPoiId);
  const activeModeId = useExplorerStore((state) => state.activeModeId);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const favorites = useExplorerStore((state) => state.favorites);
  const language = useExplorerStore((state) => state.language);
  const zoom = useExplorerStore((state) => state.zoom);
  const setActiveMode = useExplorerStore((state) => state.setActiveMode);
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const setLanguage = useExplorerStore((state) => state.setLanguage);
  const selectPoi = useExplorerStore((state) => state.selectPoi);
  const t = getTranslations(language);

  const activeMode =
    explorationModes.find((mode) => mode.id === activeModeId) ?? explorationModes[0];
  const visiblePois = getVisiblePois(pois, activeMode, zoom, searchQuery, (poi) =>
    getLocalizedPoiSearchText(poi, language)
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="absolute left-5 top-5 z-10 flex h-[calc(100dvh-2.5rem)] w-[min(370px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-white/70 bg-white/[0.82] shadow-panel backdrop-blur-xl"
    >
      <div className="border-b border-white/70 p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Travel Explorer
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-normal">{t.app.regionName}</h1>
              <MapPin className="mt-1 h-5 w-5 text-primary" />
            </div>
          </div>
          <div
            aria-label={t.app.language}
            className="flex rounded-md border border-white/70 bg-muted/75 p-0.5 shadow-sm"
          >
            {languageOptions.map((option) => (
              <button
                key={option.language}
                type="button"
                onClick={() => setLanguage(option.language)}
                className={cn(
                  "h-8 rounded px-2.5 text-xs font-semibold transition",
                  language === option.language
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
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
          {explorationModes.map((mode) => (
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
              <span className="truncate">{t.modes[mode.id].label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
          <span>
            {visiblePois.length} {t.app.visible}
          </span>
          <span>
            {favorites.length} {t.app.saved}
          </span>
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
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        {poi.rating.toFixed(1)}
                      </span>
                      <span>
                        {t.app.photo} {poi.photoScore}
                      </span>
                      <span>
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
