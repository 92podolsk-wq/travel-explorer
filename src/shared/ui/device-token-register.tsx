"use client";

import { useEffect } from "react";
import { apiFetch } from "@/shared/lib/api-fetch";
import { isNativeLocalShell } from "@/shared/lib/native-origins";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { getDeviceToken, saveDeviceToken } from "@/shared/lib/device-token-storage";

// Backfills a device token for users who logged in (via the httpOnly cookie,
// on a wayora.ru page) before this feature shipped, or whose stored token
// was cleared, so the local app-shell can still authenticate them.
export function DeviceTokenRegister() {
  const isNative = useIsNativeApp();
  const currentUser = useExplorerStore((state) => state.currentUser);

  useEffect(() => {
    if (!isNative || !currentUser || isNativeLocalShell()) {
      return;
    }

    let cancelled = false;

    (async () => {
      const existing = await getDeviceToken();
      if (existing || cancelled) {
        return;
      }

      const res = await apiFetch("/api/auth/device-token", { method: "POST" });
      if (!res.ok || cancelled) {
        return;
      }

      const { token } = (await res.json()) as { token: string };
      await saveDeviceToken(token);
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isNative, currentUser]);

  return null;
}
