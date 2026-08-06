"use client";

import { Search } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { Input } from "@/shared/ui/input";

export function HeaderSearchBar() {
  const isNative = useIsNativeApp();
  const language = useExplorerStore((state) => state.language);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const t = getTranslations(language);

  if (!isNative) {
    return null;
  }

  return (
    <div className="relative shrink-0 border-b border-border bg-card px-3 py-2">
      <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={t.app.searchAria}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={t.app.searchPlaceholder}
        className="pl-9"
      />
    </div>
  );
}
