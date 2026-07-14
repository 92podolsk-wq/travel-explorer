"use client";

import { useEffect } from "react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { WelcomePage } from "@/views/welcome";
import { ExplorerMap } from "@/widgets/explorer-map/ui/explorer-map";
import { ExplorerSidebar } from "@/widgets/explorer-sidebar/ui/explorer-sidebar";
import { FavoritesPanel } from "@/widgets/favorites-panel/ui/favorites-panel";
import { PoiDetails } from "@/widgets/poi-details/ui/poi-details";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

type ExplorerPageProps = {
  initialPois: Poi[];
  initialRegions: Region[];
  initialCountries: Country[];
  initialAreas: Area[];
  initialExplorationModes: ExplorationMode[];
  initialSiteSettings: SiteSettings;
};

export function ExplorerPage({
  initialPois,
  initialRegions,
  initialCountries,
  initialAreas,
  initialExplorationModes,
  initialSiteSettings
}: ExplorerPageProps) {
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);
  const setExplorationModes = useExplorerStore((state) => state.setExplorationModes);
  const hasHydrated = useExplorerStore((state) => state.hasHydrated);
  const hasSeenWelcome = useExplorerStore((state) => state.hasSeenWelcome);

  useHydrateAuth();

  useEffect(() => {
    setCountries(initialCountries);
    setAreas(initialAreas);
    setRegions(initialRegions);
    setPois(initialPois);
    setExplorationModes(initialExplorationModes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hasHydrated) {
    return <main className="h-dvh w-full bg-muted" />;
  }

  if (!hasSeenWelcome) {
    return <WelcomePage />;
  }

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-muted">
      <SiteHeader />
      <div className="relative flex-1 overflow-hidden">
        <ExplorerMap
          initialMapStyleId={initialSiteSettings.mapStyleId}
          initialProtomapsPmtilesUrl={initialSiteSettings.protomapsPmtilesUrl}
        />
        <ExplorerSidebar />
        <FavoritesPanel />
        <PoiDetails />
      </div>
    </main>
  );
}
