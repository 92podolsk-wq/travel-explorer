"use client";

import { Bookmark } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function FavoritesPanel() {
  const pois = useExplorerStore((state) => state.pois);
  const favorites = useExplorerStore((state) => state.favorites);
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));

  return (
    <div className="absolute left-1/2 top-6 z-10 hidden -translate-x-1/2 items-center gap-3 rounded-md border border-white/70 bg-white/[0.82] px-3 py-2 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur-xl lg:flex">
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Bookmark className="h-3.5 w-3.5" />
        {favoritePois.length} {t.app.saved}
      </span>
    </div>
  );
}
