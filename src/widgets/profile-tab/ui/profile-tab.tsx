"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check, Heart, LogOut, Map as MapIcon, Pencil, Route as RouteIcon, Trash2, X } from "lucide-react";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import type { User } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { cn } from "@/shared/lib/cn";
import { navigateShell } from "@/shared/lib/shell-navigation";
import { isNativeLocalShell } from "@/shared/lib/native-origins";
import { getDeviceToken, clearDeviceToken } from "@/shared/lib/device-token-storage";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import {
  clearPushToken,
  isPushDisabledByUser,
  readPushToken,
  savePushToken,
  setPushDisabledByUser
} from "@/shared/lib/push-token-storage";
import { clearDownloadedMaps, getDownloadedRegionIds } from "@/shared/lib/offline-maps-storage";
import { PackingChecklistCard } from "./packing-checklist-card";
import { FriendsCard } from "./friends-card";
import { SharedChecklistsCard } from "./shared-checklists-card";
import { SharedItinerariesCard } from "./shared-itineraries-card";

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
  const currentUser = useExplorerStore((state) => state.currentUser);
  const favorites = useExplorerStore((state) => state.favorites);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const itineraries = useExplorerStore((state) => state.itineraries);

  const [permission, setPermission] = useState<PermissionState>("unknown");
  const [isBusy, setIsBusy] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [mapsDeleted, setMapsDeleted] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hideFromSearchDraft, setHideFromSearchDraft] = useState(false);

  async function handleSelectAvatar(avatarId: AvatarId) {
    const res = await apiFetch("/api/me/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId })
    });
    if (res.ok) {
      const data = (await res.json()) as { user: User };
      hydrateAuth(data.user);
      setIsAvatarPickerOpen(false);
    }
  }

  function handleStartEditProfile() {
    setNameDraft(currentUser?.name ?? "");
    setUsernameDraft(currentUser?.username ?? "");
    setHideFromSearchDraft(currentUser?.hideFromSearch ?? false);
    setProfileError(null);
    setIsEditingProfile(true);
  }

  async function handleSaveProfile() {
    setProfileError(null);
    setIsSavingProfile(true);
    try {
      const res = await apiFetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameDraft, username: usernameDraft, hideFromSearch: hideFromSearchDraft })
      });
      const data = (await res.json()) as { user?: User; error?: string };
      if (!res.ok) {
        setProfileError(data.error ?? "Что-то пошло не так.");
        return;
      }
      if (data.user) hydrateAuth(data.user);
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  }

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
      {currentUser && (
        <section className="profile-hero-gradient relative overflow-hidden rounded-md p-5 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/[0.07]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-6 -left-4 h-20 w-20 rounded-full bg-white/[0.06]" />
          <div className="relative flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen((value) => !value)}
              className="relative"
              aria-label={t.changeAvatar}
            >
              <div className="rounded-full border-2 border-white/50 p-0.5">
                <ProfileAvatar avatarId={currentUser.avatarId} className="h-16 w-16" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a5049] bg-primary text-white">
                <Pencil className="h-2.5 w-2.5" />
              </span>
            </button>
            {isEditingProfile ? (
              <div className="mt-2 flex w-full max-w-xs flex-col gap-2 rounded-md bg-white/[0.12] p-3 text-left">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/80">{t.name}</span>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50 outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white/80">{t.username}</span>
                  <input
                    value={usernameDraft}
                    onChange={(e) => setUsernameDraft(e.target.value.toLowerCase())}
                    pattern="[a-z0-9_]{3,20}"
                    title={t.usernameHint}
                    className="rounded border border-white/30 bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50 outline-none"
                  />
                  <span className="text-[10px] text-white/60">{t.usernameHint}</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] font-medium text-white/80">
                  <input
                    type="checkbox"
                    checked={hideFromSearchDraft}
                    onChange={(e) => setHideFromSearchDraft(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-white/30 bg-white/10"
                  />
                  {t.hideFromSearch}
                </label>
                {profileError && <p className="text-[11px] font-medium text-red-200">{profileError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveProfile()}
                    disabled={isSavingProfile}
                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-primary hover:bg-white/90 disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {t.save}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="text-base font-bold">{currentUser.name || currentUser.email}</h2>
                  <span className="rounded-full bg-white/[0.18] px-2.5 py-0.5 text-[11px] font-semibold">
                    {t.travelerBadge}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">@{currentUser.username}</p>
                <button
                  type="button"
                  onClick={handleStartEditProfile}
                  className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
                >
                  <Pencil className="h-2.5 w-2.5" />
                  {t.editProfile}
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {isAvatarPickerOpen && currentUser && (
        <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
          <h2 className="text-sm font-semibold text-foreground">{t.chooseAvatar}</h2>
          <div className="grid grid-cols-6 gap-3">
            {avatarIds.map((avatarId) => {
              const isSelected = currentUser.avatarId === avatarId;
              return (
                <button
                  key={avatarId}
                  type="button"
                  onClick={() => void handleSelectAvatar(avatarId)}
                  aria-label={avatarId}
                  className={cn(
                    "relative flex items-center justify-center rounded-full border-2 p-0.5 transition hover:-translate-y-0.5",
                    isSelected ? "border-primary" : "border-transparent"
                  )}
                >
                  <ProfileAvatar avatarId={avatarId} className="h-11 w-11" />
                  {isSelected && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {currentUser && (
        <section className="flex items-center rounded-md border border-border bg-card/[0.78] p-4">
          <div className="flex flex-1 flex-col items-center gap-1">
            <Heart className="h-[18px] w-[18px] text-primary" />
            <span className="text-lg font-extrabold text-foreground">{favorites.length}</span>
            <span className="text-[11px] text-muted-foreground">{t.statsSaved}</span>
          </div>
          <div className="h-9 w-px bg-border" />
          <div className="flex flex-1 flex-col items-center gap-1">
            <MapIcon className="h-[18px] w-[18px] text-primary" />
            <span className="text-lg font-extrabold text-foreground">{visitedPoiIds.length}</span>
            <span className="text-[11px] text-muted-foreground">{appT.visited}</span>
          </div>
          <div className="h-9 w-px bg-border" />
          <div className="flex flex-1 flex-col items-center gap-1">
            <RouteIcon className="h-[18px] w-[18px] text-primary" />
            <span className="text-lg font-extrabold text-foreground">{itineraries.length}</span>
            <span className="text-[11px] text-muted-foreground">{t.statsRoutes}</span>
          </div>
        </section>
      )}

      <FriendsCard />

      <SharedChecklistsCard />

      <SharedItinerariesCard />

      <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
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

      <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
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

      <PackingChecklistCard />

      <Button type="button" variant="outline" onClick={() => void handleLogout()} className="self-start">
        <LogOut className="h-4 w-4" />
        {t.logout}
      </Button>
    </div>
  );
}
