"use client";

import { useEffect } from "react";
import { useExplorerStore } from "@/shared/model/explorer-store";

export function LanguageApplier() {
  const language = useExplorerStore((state) => state.language);

  useEffect(() => {
    document.documentElement.dataset.lang = language;
  }, [language]);

  return null;
}
