"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { subscribeOfflineToast } from "@/shared/lib/offline-toast";

export function OfflineToast() {
  const isNative = useIsNativeApp();
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isNative) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = subscribeOfflineToast(() => {
      setIsVisible(true);
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsVisible(false), 2500);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isNative]);

  if (!isNative || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-4 z-[60] flex items-center justify-center gap-2 rounded-full bg-foreground/90 px-4 py-2.5 text-sm font-medium text-white shadow-panel backdrop-blur-xl"
      style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      {t.app.offlineMessage}
    </div>
  );
}
