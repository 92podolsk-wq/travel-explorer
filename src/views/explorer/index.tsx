"use client";

import { useEffect } from "react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { useExplorerStore } from "@/shared/model/explorer-store";
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
};

export function ExplorerPage({ initialPois, initialRegions, initialCountries, initialAreas }: ExplorerPageProps) {
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);

  useEffect(() => {
    setCountries(initialCountries);
    setAreas(initialAreas);
    setRegions(initialRegions);
    setPois(initialPois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex h-dvh w-full flex-col overflow-hidden bg-muted">
      <SiteHeader />
      <div className="relative flex-1 overflow-hidden">
        <ExplorerMap />
        <ExplorerSidebar />
        <FavoritesPanel />
        <PoiDetails />
      </div>
    </main>
  );
}
