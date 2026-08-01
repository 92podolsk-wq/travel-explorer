"use client";

import { useEffect } from "react";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { showNavigationTransition } from "@/shared/lib/navigation-transition";
import { REMOTE_ORIGIN, LOCAL_SHELL_URL } from "@/shared/lib/native-origins";

function handleIncomingUrl(rawUrl: string) {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }

  if (url.origin !== REMOTE_ORIGIN) {
    return;
  }

  showNavigationTransition();

  if (url.pathname === "/" || url.pathname === "/app-shell") {
    window.location.href = LOCAL_SHELL_URL + url.search;
    return;
  }

  window.location.href = url.href;
}

export function DeepLinkHandler() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isNative) {
      return;
    }

    let removeListener: (() => void) | undefined;

    async function setup() {
      const { App } = await import("@capacitor/app");

      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        handleIncomingUrl(launch.url);
      }

      const handle = await App.addListener("appUrlOpen", (data) => {
        handleIncomingUrl(data.url);
      });
      removeListener = () => handle.remove();
    }

    setup().catch(() => {});

    return () => {
      removeListener?.();
    };
  }, [isNative]);

  return null;
}
