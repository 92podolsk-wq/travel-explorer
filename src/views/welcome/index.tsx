"use client";

import { useMemo } from "react";
import { Compass, Infinity as InfinityIcon, MapPin, Sparkles, Wand2 } from "lucide-react";
import type { Poi } from "@/entities/poi/model/types";
import { getModeIcon } from "@/features/exploration-mode/ui/mode-icon";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-tight text-foreground">{value}</div>
        <div className="truncate text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function CoverImage({ photo, alt, className }: { photo: Poi["photos"][number] | null; alt: string; className?: string }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photo.url} alt={photo.alt || alt} className={cn("object-cover", className)} />
  ) : (
    <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
      <MapPin className="h-6 w-6" />
    </div>
  );
}

function topPhotoFor(pois: Poi[]): Poi["photos"][number] | null {
  const withPhotos = pois.filter((poi) => poi.photos.length > 0);
  const sorted = [...withPhotos].sort((a, b) => b.importance - a.importance);
  return sorted[0]?.photos[0] ?? null;
}

export function WelcomePage() {
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const explorationModes = useExplorerStore((state) => state.explorationModes);
  const language = useExplorerStore((state) => state.language);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const toggleModeFilter = useExplorerStore((state) => state.toggleModeFilter);
  const setHasSeenWelcome = useExplorerStore((state) => state.setHasSeenWelcome);
  const t = getTranslations(language).welcome;

  const heroRegion = regions[0];
  const heroPhoto = useMemo(() => topPhotoFor(pois), [pois]);

  const galleryItems = useMemo(
    () =>
      [...pois]
        .filter((poi) => poi.photos.length > 0)
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 8)
        .map((poi) => ({ poiId: poi.id, name: poi.name, photo: poi.photos[0] })),
    [pois]
  );

  function regionPoiCount(regionId: string) {
    return pois.filter((poi) => poi.regionId === regionId).length;
  }

  function regionPhoto(regionId: string) {
    return topPhotoFor(pois.filter((poi) => poi.regionId === regionId));
  }

  function enterRegion(regionId: string) {
    setActiveRegion(regionId);
    setHasSeenWelcome(true);
  }

  function enterMode(modeId: string) {
    toggleModeFilter(modeId);
    setHasSeenWelcome(true);
  }

  function enterApp() {
    setHasSeenWelcome(true);
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-muted">
      <SiteHeader />
      <div className="flex-1 overflow-y-auto">
        <section className="relative overflow-hidden border-b border-border bg-white">
          {heroPhoto && (
            <CoverImage photo={heroPhoto} alt={t.heroTitle} className="absolute inset-0 h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/90 to-white/70 sm:bg-gradient-to-r sm:from-white sm:via-white/85 sm:to-white/40" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 sm:py-20">
            <h1 className="max-w-xl text-3xl font-bold leading-tight text-foreground sm:text-5xl">{t.heroTitle}</h1>
            <p className="max-w-md text-sm text-muted-foreground sm:text-base">{t.heroSubtitle}</p>
            <div className="flex flex-wrap gap-3">
              {heroRegion && (
                <Button type="button" onClick={() => enterRegion(heroRegion.id)}>
                  {t.heroExploreCta.replace("{region}", heroRegion.nameByLanguage[language])}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t.heroHowItWorksCta}
              </Button>
            </div>
            <div className="mt-2 flex max-w-2xl flex-wrap gap-1 rounded-lg border border-border bg-white/85 backdrop-blur">
              <StatItem icon={<MapPin className="h-4.5 w-4.5" />} value={pois.length} label={t.statsPlaces} />
              <StatItem icon={<Compass className="h-4.5 w-4.5" />} value={regions.length} label={t.statsRegions} />
              <StatItem icon={<Sparkles className="h-4.5 w-4.5" />} value={explorationModes.length} label={t.statsModes} />
              <StatItem icon={<InfinityIcon className="h-4.5 w-4.5" />} value="∞" label={t.statsInfinity} />
            </div>
          </div>
        </section>

        {regions.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-4 text-xl font-bold text-foreground">{t.destinationsTitle}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => enterRegion(region.id)}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CoverImage
                    photo={regionPhoto(region.id)}
                    alt={region.nameByLanguage[language]}
                    className="h-28 w-full"
                  />
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-foreground">{region.nameByLanguage[language]}</p>
                    <p className="text-xs text-muted-foreground">
                      {regionPoiCount(region.id)} {t.placesUnit}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {explorationModes.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="mb-4 text-xl font-bold text-foreground">{t.modesTitle}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {explorationModes.map((mode) => {
                const ModeIcon = getModeIcon(mode.icon);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => enterMode(mode.id)}
                    className="flex flex-col items-start gap-2 rounded-lg border border-border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <ModeIcon className="h-6 w-6 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{mode.nameByLanguage[language]}</p>
                    <p className="text-xs text-muted-foreground">{mode.descriptionByLanguage[language]}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {galleryItems.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 py-12">
            <h2 className="text-xl font-bold text-foreground">{t.galleryTitle}</h2>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">{t.gallerySubtitle}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {galleryItems.map(({ poiId, name, photo }) => (
                <button
                  key={poiId}
                  type="button"
                  onClick={enterApp}
                  className="overflow-hidden rounded-lg border border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CoverImage photo={photo} alt={name} className="h-28 w-full sm:h-32" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wand2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{t.itineraryTitle}</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">{t.itineraryBody}</p>
              </div>
            </div>
            <Button type="button" onClick={enterApp} className="shrink-0">
              {t.itineraryCta}
            </Button>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="mb-6 text-xl font-bold text-foreground">{t.howItWorksTitle}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { title: t.step1Title, body: t.step1Body },
              { title: t.step2Title, body: t.step2Body },
              { title: t.step3Title, body: t.step3Body },
              { title: t.step4Title, body: t.step4Body },
              { title: t.step5Title, body: t.step5Body }
            ].map((step, index) => (
              <div key={step.title} className="flex flex-col gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-border bg-white px-6 py-6 text-center text-xs text-muted-foreground">
          Wayora — Explore Japan
        </footer>
      </div>
    </main>
  );
}
