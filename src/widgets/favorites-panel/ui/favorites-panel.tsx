"use client";

import { Bookmark, Download, ExternalLink } from "lucide-react";
import { buildFavoritesKml } from "@/features/favorites-export/lib/build-kml";
import { buildGoogleMapsUrl } from "@/features/favorites-export/lib/build-google-maps-url";
import { downloadTextFile } from "@/features/favorites-export/lib/download-file";
import { optimizeRouteOrder } from "@/features/favorites-export/lib/optimize-route";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function FavoritesPanel() {
  const pois = useExplorerStore((state) => state.pois);
  const favorites = useExplorerStore((state) => state.favorites);
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
  const optimizedFavoritePois = optimizeRouteOrder(favoritePois);

  const handleExport = () => {
    if (optimizedFavoritePois.length === 0) {
      return;
    }

    const kml = buildFavoritesKml(optimizedFavoritePois, `Travel Explorer — ${t.app.regionName}`);
    downloadTextFile("travel-explorer-favorites.kml", kml, "application/vnd.google-earth.kml+xml");
  };

  const handleOpenInMaps = () => {
    const url = buildGoogleMapsUrl(optimizedFavoritePois);

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="absolute left-1/2 top-6 z-10 hidden -translate-x-1/2 items-center gap-3 rounded-md border border-white/70 bg-white/[0.82] px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur-xl md:flex">
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Bookmark className="h-3.5 w-3.5" />
        {favoritePois.length} {t.app.saved}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOpenInMaps}
        disabled={favoritePois.length === 0}
        title={t.app.openInMapsHint}
        className="h-7 gap-1.5 rounded-md bg-white px-2.5 text-xs"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {t.app.openInMaps}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={favoritePois.length === 0}
        title={t.app.exportKmlHint}
        className="h-7 gap-1.5 rounded-md bg-white px-2.5 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        {t.app.exportKml}
      </Button>
    </div>
  );
}
