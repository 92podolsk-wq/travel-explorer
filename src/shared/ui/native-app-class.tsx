"use client";

import { useEffect } from "react";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";

export function NativeAppClass() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (isNative) {
      document.documentElement.setAttribute("data-native-app", "true");
    } else {
      document.documentElement.removeAttribute("data-native-app");
    }
  }, [isNative]);

  return null;
}
