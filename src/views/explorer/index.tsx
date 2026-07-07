"use client";

import { useEffect } from "react";
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
};

export function ExplorerPage({ initialPois, initialRegions }: ExplorerPageProps) {
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);

  useEffect(() => {
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
