"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, LogOut, Map as MapIcon, Trash2 } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { navigateShell } from "@/shared/lib/shell-navigation";
import { isNativeLocalShell } from "@/shared/lib/native-origins";
import { getDeviceToken, clearDeviceToken } from "@/shared/lib/device-token-storage";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Button } from "@/shared/ui/button";
import {
  clearPushToken,
  isPushDisabledByUser,
  readPushToken,
  savePushToken,
  setPushDisabledByUser
} from "@/shared/lib/push-token-storage";
import { clearDownloadedMaps, getDownloadedRegionIds } from "@/shared/lib/offline-maps-storage";

type PermissionState = "granted" | "denied" | "prompt" | "unknown";

export function ProfileTab() {
  const router = useRouter();
  const language = useExplorerStore((state) => state.language);
  const dict = getTranslations(language);
  const t = dict.auth;
  const appT = dict.app;
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const setCustomMarkers = useExplorerStore((state) => state.setCustomMarkers);

  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [isBusy, setIsBusy] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [mapsDeleted, setMapsDeleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDownloadedRegionIds().then((ids) => {
      if (!cancelled) setDownloadedCount(ids.length);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteDownloadedMaps() {
    await clearDownloadedMaps();
    setDownloadedCount(0);
    setMapsDeleted(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPermission() {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const status = await PushNotifications.checkPermissions();
        if (isMounted) {
          setPermission(status.receive as PermissionState);
        }
      } catch {
        if (isMounted) setPermission("unknown");
      }
    }

    loadPermission();
    return () => {
      isMounted = false;
    };
  }, []);

  const isEnabled = permission === "granted" && !isPushDisabledByUser();

  async function handleEnable() {
    setIsBusy(true);
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const result = await PushNotifications.requestPermissions();
      setPermission(result.receive as PermissionState);
      if (result.receive === "granted") {
        setPushDisabledByUser(false);
        PushNotifications.addListener("registration", (token) => {
          savePushToken(token.value);
          apiFetch("/api/me/push-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token.value })
          }).catch(() => {});
        });
        await PushNotifications.register();
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisable() {
    setIsBusy(true);
    try {
      const token = readPushToken();
      if (token) {
        await apiFetch("/api/me/push-token", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        }).catch(() => {});
      }
      clearPushToken();
      setPushDisabledByUser(true);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    const deviceToken = await getDeviceToken();
    await apiFetch("/api/auth/logout", { method: "POST" });
    if (deviceToken) {
      await apiFetch("/api/auth/device-token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: deviceToken })
      }).catch(() => {});
    }
    await clearDeviceToken();
    hydrateAuth(null);
    setItinerary(null);
    setItineraries([]);
    setActiveItineraryId(null);
    setCustomMarkers([]);
    if (isNativeLocalShell()) {
      navigateShell("map");
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-md border border-border bg-white/[0.78] p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {isEnabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          {t.pushNotificationsTitle}
        </h2>

        {permission === "denied" ? (
          <p className="text-xs text-muted-foreground">{t.pushNotificationsDenied}</p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {isEnabled ? t.pushNotificationsEnabled : t.pushNotificationsDisabled}
            </p>
            <Button
              type="button"
              size="sm"
              variant={isEnabled ? "outline" : "default"}
              disabled={isBusy}
              onClick={() => void (isEnabled ? handleDisable() : handleEnable())}
            >
              {isEnabled ? t.pushNotificationsDisabled : t.pushNotificationsEnable}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-border bg-white/[0.78] p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <MapIcon className="h-4 w-4 text-primary" />
          {appT.offlineMapsManageTitle}
        </h2>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {mapsDeleted
              ? appT.offlineMapsManageDeleted
              : downloadedCount === 0
                ? appT.offlineMapsManageEmpty
                : `${downloadedCount}`}
          </p>
          {downloadedCount > 0 && !mapsDeleted && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => void handleDeleteDownloadedMaps()}
            >
              <Trash2 className="h-4 w-4" />
              {appT.offlineMapsManageDelete}
            </Button>
          )}
        </div>
      </section>

      <Button type="button" variant="outline" onClick={() => void handleLogout()} className="self-start">
        <LogOut className="h-4 w-4" />
        {t.logout}
      </Button>
    </div>
  );
}
