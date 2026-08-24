"use client";

import { motion } from "framer-motion";
import { Eye, MapPin } from "lucide-react";
import { PoiRow } from "@/entities/poi/ui/poi-row";
import { getTranslations } from "@/shared/i18n/translations";
import { cn } from "@/shared/lib/cn";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function HistoryTab({
  isActive,
  requestClear,
  goToPoi
}: {
  isActive: boolean;
  requestClear: (kind: "visited" | "viewed") => void;
  goToPoi: (poiId: string) => void;
}) {
  const language = useExplorerStore((state) => state.language);
  const regions = useExplorerStore((state) => state.regions);
  const pois = useExplorerStore((state) => state.pois);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);

  const t = getTranslations(language).auth;

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  const viewedPois = pois.filter((poi) => viewedPoiIds.includes(poi.id));
  const visitedPois = pois.filter((poi) => visitedPoiIds.includes(poi.id));

  return (
    <>
      <section className={cn("flex flex-col gap-3", !isActive && "hidden")}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {t.visitedPlaces}
          </h2>
          {visitedPois.length > 0 && (
            <button
              type="button"
              onClick={() => requestClear("visited")}
              className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t.clearVisited}
            </button>
          )}
        </div>
        {visitedPois.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noVisitedPlaces}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visitedPois.map((poi, index) => (
              <motion.div
                key={poi.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
              >
                <PoiRow poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className={cn("flex flex-col gap-3", !isActive && "hidden")}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            {t.viewedPlaces}
          </h2>
          {viewedPois.length > 0 && (
            <button
              type="button"
              onClick={() => requestClear("viewed")}
              className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t.clearViewed}
            </button>
          )}
        </div>
        {viewedPois.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noViewedPlaces}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {viewedPois.map((poi, index) => (
              <motion.div
                key={poi.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
              >
                <PoiRow poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
