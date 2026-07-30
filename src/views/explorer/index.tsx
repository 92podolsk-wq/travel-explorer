"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WifiOff } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Country } from "@/entities/country/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { detectDeviceLanguage } from "@/shared/lib/detect-device-language";
import { getTranslations } from "@/shared/i18n/translations";
import { WelcomePage } from "@/views/welcome";
import { ExplorerMap } from "@/widgets/explorer-map/ui/explorer-map";
import { ExplorerSidebar } from "@/widgets/explorer-sidebar/ui/explorer-sidebar";
import { PoiDetails } from "@/widgets/poi-details/ui/poi-details";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";
import { HeaderSearchBar } from "@/widgets/site-header/ui/header-search-bar";
import { Button } from "@/shared/ui/button";

const BOOTSTRAP_URL = "https://wayora.ru/api/bootstrap";

type BootstrapData = {
  pois: Poi[];
  regions: Region[];
  countries: Country[];
  areas: Area[];
  explorationModes: ExplorationMode[];
  categories: Category[];
  siteSettings: SiteSettings;
};

type ExplorerPageProps = {
  initialPois: Poi[];
  initialRegions: Region[];
  initialCountries: Country[];
  initialAreas: Area[];
  initialExplorationModes: ExplorationMode[];
  initialCategories: Category[];
  initialSiteSettings: SiteSettings;
};

export function ExplorerPage({
  initialPois,
  initialRegions,
  initialCountries,
  initialAreas,
  initialExplorationModes,
  initialCategories,
  initialSiteSettings
}: ExplorerPageProps) {
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);
  const setExplorationModes = useExplorerStore((state) => state.setExplorationModes);
  const setCategories = useExplorerStore((state) => state.setCategories);
  const setActiveRegion = useExplorerStore((state) => state.setActiveRegion);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const hasHydrated = useExplorerStore((state) => state.hasHydrated);
  const hasSeenWelcome = useExplorerStore((state) => state.hasSeenWelcome);
  const hasAutoDetectedLanguage = useExplorerStore((state) => state.hasAutoDetectedLanguage);
  const setLanguage = useExplorerStore((state) => state.setLanguage);
  const setHasAutoDetectedLanguage = useExplorerStore((state) => state.setHasAutoDetectedLanguage);
  const searchParams = useSearchParams();
  const sharedPoiId = searchParams.get("poi");
  const isNative = useIsNativeApp();
  const isLocalShell = initialRegions.length === 0;
  const [isBootstrapping, setIsBootstrapping] = useState(isLocalShell);
  const [bootstrapFailed, setBootstrapFailed] = useState(false);
  const [siteSettings, setSiteSettings] = useState(initialSiteSettings);
  const [retryCount, setRetryCount] = useState(0);
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language).app;

  useHydrateAuth();

  useEffect(() => {
    async function bootstrap() {
      let data: BootstrapData = {
        pois: initialPois,
        regions: initialRegions,
        countries: initialCountries,
        areas: initialAreas,
        explorationModes: initialExplorationModes,
        categories: initialCategories,
        siteSettings: initialSiteSettings
      };

      if (isLocalShell) {
        try {
          const response = await fetch(BOOTSTRAP_URL);
          data = (await response.json()) as BootstrapData;
        } catch {
          setIsBootstrapping(false);
          setBootstrapFailed(true);
          return;
        }
      }

      setBootstrapFailed(false);
      setCountries(data.countries);
      setAreas(data.areas);
      setRegions(data.regions);
      setPois(data.pois);
      setExplorationModes(data.explorationModes);
      setCategories(data.categories);
      setSiteSettings(data.siteSettings);

      const sharedPoi = sharedPoiId ? data.pois.find((poi) => poi.id === sharedPoiId) : undefined;
      if (sharedPoi) {
        setActiveRegion(sharedPoi.regionId);
        selectPoiFromMap(sharedPoi.id);
      }

      setIsBootstrapping(false);
    }

    setIsBootstrapping(true);
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  useEffect(() => {
    if (hasHydrated && isNative && !hasAutoDetectedLanguage) {
      setLanguage(detectDeviceLanguage());
      setHasAutoDetectedLanguage(true);
    }
  }, [hasHydrated, isNative, hasAutoDetectedLanguage, setLanguage, setHasAutoDetectedLanguage]);

  if (!hasHydrated || isBootstrapping) {
    return <main className="h-dvh w-full bg-muted" />;
  }

  if (bootstrapFailed) {
    return (
      <main className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="text-base font-semibold text-foreground">{t.offlineFirstLaunchTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.offlineFirstLaunchHint}</p>
        </div>
        <Button onClick={() => setRetryCount((count) => count + 1)}>{t.retryButton}</Button>
      </main>
    );
  }

  if (!hasSeenWelcome) {
    return <WelcomePage />;
  }

  return (
    <main
      className="flex h-dvh w-full flex-col overflow-hidden bg-muted"
      style={isNative ? { paddingBottom: "calc(56px + env(safe-area-inset-bottom))" } : undefined}
    >
      <SiteHeader />
      <HeaderSearchBar />
      <div className="relative flex-1 overflow-hidden">
        <ExplorerMap
          initialMapStyleId={siteSettings.mapStyleId}
          initialProtomapsPmtilesUrl={siteSettings.protomapsPmtilesUrl}
        />
        <ExplorerSidebar />
        <PoiDetails />
      </div>
    </main>
  );
}
