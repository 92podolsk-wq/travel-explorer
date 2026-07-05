"use client";

import { useEffect } from "react";
import type { Poi } from "@/entities/poi/model/types";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ExplorerMap } from "@/widgets/explorer-map/ui/explorer-map";
import { ExplorerSidebar } from "@/widgets/explorer-sidebar/ui/explorer-sidebar";
import { FavoritesPanel } from "@/widgets/favorites-panel/ui/favorites-panel";
import { PoiDetails } from "@/widgets/poi-details/ui/poi-details";

type ExplorerPageProps = {
  initialPois: Poi[];
};

export function ExplorerPage({ initialPois }: ExplorerPageProps) {
  const setPois = useExplorerStore((state) => state.setPois);

  useEffect(() => {
    setPois(initialPois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-muted">
      <ExplorerMap />
      <ExplorerSidebar />
      <FavoritesPanel />
      <PoiDetails />
    </main>
  );
}
