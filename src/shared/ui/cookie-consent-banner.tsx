"use client";

import { useEffect, useState } from "react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { Button } from "@/shared/ui/button";

const consentStorageKey = "travel-explorer-cookie-consent";

export function CookieConsentBanner() {
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);
  const isNative = useIsNativeApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(consentStorageKey) !== "accepted") {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible || isNative) {
    return null;
  }

  function handleAccept() {
    localStorage.setItem(consentStorageKey, "accepted");
    setIsVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2.5 border-t border-border bg-white/95 px-4 py-3 shadow-panel backdrop-blur-xl sm:flex-row sm:justify-center">
      <p className="text-xs text-muted-foreground sm:text-sm">{t.app.cookieConsentText}</p>
      <Button type="button" size="sm" onClick={handleAccept} className="shrink-0">
        {t.app.cookieConsentAccept}
      </Button>
    </div>
  );
}
