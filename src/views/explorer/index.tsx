"use client";

import { ExplorerMap } from "@/widgets/explorer-map/ui/explorer-map";
import { ExplorerSidebar } from "@/widgets/explorer-sidebar/ui/explorer-sidebar";
import { PoiDetails } from "@/widgets/poi-details/ui/poi-details";

export function ExplorerPage() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-muted">
      <ExplorerMap />
      <ExplorerSidebar />
      <PoiDetails />
    </main>
  );
}
