"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Region } from "@/entities/region/model/types";
import { AuthMenu } from "@/features/auth/ui/auth-menu";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { CityIcon } from "@/shared/ui/city-icon";
import { CountryFlagIcon } from "@/shared/ui/country-flag-icon";
import { cn } from "@/shared/lib/cn";

type CountryGroup = {
  country: Country;
  areaGroups: Array<{ area: Area; regions: Region[] }>;
};

export function SiteHeader() {
  const router = useRouter();
  const regions = useExplorerStore((state) => state.regions);
  const areas = useExplorerStore((state) => state.areas);
  const countries = useExplorerStore((state) => state.countries);
  const activeRegionIds = useExplorerStore((state) => state.activeRegionIds);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const setActiveArea = useExplorerStore((state) => state.setActiveArea);
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);

  const activeRegion = regions.find((region) => region.id === activeRegionIds[0]) ?? regions[0];
  const activeArea = activeRegion ? areas.find((area) => area.id === activeRegion.areaId) : undefined;
  const activeCountry = activeArea ? countries.find((country) => country.id === activeArea.countryId) : undefined;
  const isAreaActive = activeRegionIds.length > 1;

  const countryGroups: CountryGroup[] = [];
  for (const region of regions) {
    const area = areas.find((a) => a.id === region.areaId);
    const country = area ? countries.find((c) => c.id === area.countryId) : undefined;
    if (!area || !country) {
      continue;
    }

    let countryGroup = countryGroups.find((group) => group.country.id === country.id);
    if (!countryGroup) {
      countryGroup = { country, areaGroups: [] };
      countryGroups.push(countryGroup);
    }
    let areaGroup = countryGroup.areaGroups.find((group) => group.area.id === area.id);
    if (!areaGroup) {
      areaGroup = { area, regions: [] };
      countryGroup.areaGroups.push(areaGroup);
    }
    areaGroup.regions.push(region);
  }

  if (!activeRegion) {
    return null;
  }

  const effectiveSelectedCountryId = selectedCountryId ?? activeCountry?.id ?? countryGroups[0]?.country.id;
  const selectedCountryGroup =
    countryGroups.find((group) => group.country.id === effectiveSelectedCountryId) ?? countryGroups[0];

  function renderAreaGroups(areaGroups: CountryGroup["areaGroups"]) {
    return areaGroups.map((areaGroup) => {
      const isThisAreaActive = areaGroup.regions.every((region) => activeRegionIds.includes(region.id));

      return (
        <div key={areaGroup.area.id} className="flex flex-col gap-3 lg:flex-row lg:gap-8">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t.app.area}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveArea(areaGroup.area.id);
                setIsMenuOpen(false);
                router.push("/");
              }}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-left text-sm font-semibold transition",
                isThisAreaActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
              )}
            >
              {isThisAreaActive ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0" />
              )}
              {areaGroup.area.nameByLanguage[language]}
            </button>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t.app.city}
            </p>
            <div className="flex flex-col gap-0.5">
              {areaGroup.regions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => {
                    setActiveRegion(region.id);
                    setIsMenuOpen(false);
                    router.push("/");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-left text-sm font-medium transition",
                    activeRegionIds.includes(region.id) && !isThisAreaActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {activeRegionIds.includes(region.id) && !isThisAreaActive ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {region.nameByLanguage[language]}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-3 sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex shrink-0 items-center gap-2.5 rounded-md transition hover:opacity-80"
      >
        <Image
          src="/logo-icon.png"
          alt="Travel Explorer"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
          priority
        />
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-foreground">Travel Explorer</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Explore Japan
          </p>
        </div>
      </button>

      <div className="relative min-w-0 flex-1 sm:flex-initial">
        <button
          type="button"
          onClick={() =>
            setIsMenuOpen((value) => {
              if (!value) {
                setSelectedCountryId(null);
              }
              return !value;
            })
          }
          aria-expanded={isMenuOpen}
          className="flex w-full min-w-0 items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/60 sm:w-auto"
        >
          <CityIcon regionId={activeRegion.id} sealCharacter={activeRegion.sealCharacter} className="h-5 w-5 shrink-0 shadow-none" />
          <span className="min-w-0 flex-1 truncate text-left">
            {isAreaActive
              ? [activeArea?.nameByLanguage[language], activeCountry?.nameByLanguage[language]].filter(Boolean).join(", ")
              : [
                  activeRegion.nameByLanguage[language],
                  activeArea?.nameByLanguage[language],
                  activeCountry?.nameByLanguage[language]
                ]
                  .filter(Boolean)
                  .join(", ")}
          </span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isMenuOpen && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        {isMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              className={cn(
                "fixed inset-x-3 top-[4.5rem] z-40 flex max-h-[70dvh] flex-col gap-4 overflow-y-auto overscroll-contain rounded-lg border border-border bg-white p-4 shadow-panel",
                "lg:absolute lg:inset-x-auto lg:left-1/2 lg:top-full lg:mt-2 lg:max-h-none lg:w-max lg:-translate-x-1/2 lg:overflow-visible lg:p-0"
              )}
            >
              <div className="flex flex-col gap-4 lg:hidden">
                {countryGroups.map((countryGroup) => (
                  <div key={countryGroup.country.id} className="flex flex-col gap-3">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {t.app.country}
                      </p>
                      <p className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-foreground">
                        <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <CountryFlagIcon countryId={countryGroup.country.id} />
                        {countryGroup.country.nameByLanguage[language]}
                      </p>
                    </div>
                    {renderAreaGroups(countryGroup.areaGroups)}
                  </div>
                ))}
              </div>

              <div className="hidden lg:flex">
                <div className="w-44 shrink-0 border-r border-border p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t.app.country}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {countryGroups.map((countryGroup) => (
                      <button
                        key={countryGroup.country.id}
                        type="button"
                        onClick={() => setSelectedCountryId(countryGroup.country.id)}
                        className={cn(
                          "flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-left text-sm font-semibold transition",
                          countryGroup.country.id === effectiveSelectedCountryId
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted/60"
                        )}
                      >
                        {countryGroup.country.id === effectiveSelectedCountryId ? (
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <CountryFlagIcon countryId={countryGroup.country.id} />
                        {countryGroup.country.nameByLanguage[language]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-8 p-4">
                  {selectedCountryGroup && renderAreaGroups(selectedCountryGroup.areaGroups)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <LanguageSwitcher />
        <AuthMenu />
      </div>
    </header>
  );
}
