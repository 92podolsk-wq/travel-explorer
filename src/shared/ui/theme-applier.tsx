"use client";

import { useEffect } from "react";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { applyTheme } from "@/shared/lib/theme";

export function ThemeApplier() {
  const theme = useExplorerStore((state) => state.theme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(theme);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  return null;
}
