"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean };
  }
}

export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Boolean(window.Capacitor?.isNativePlatform?.()));
  }, []);

  return isNative;
}
