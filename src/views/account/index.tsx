"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { AvatarPickerPanel } from "@/entities/user/ui/avatar-picker-panel";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useAvatarPicker } from "@/shared/model/use-avatar-picker";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { subscribeAccountTabChange } from "@/shared/lib/account-tab-navigation";
import { navigateShell, useShellNavigation } from "@/shared/lib/shell-navigation";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { cn } from "@/shared/lib/cn";
import { FavoritesMap } from "@/widgets/favorites-map/ui/favorites-map";
import { HistoryTab } from "@/widgets/history-tab/ui/history-tab";
import { SavedTab } from "@/widgets/saved-tab/ui/saved-tab";
import { RouteTab } from "@/widgets/route-tab/ui/route-tab";
import { ProfileTab } from "@/widgets/profile-tab/ui/profile-tab";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

type AccountTab = "route" | "saved" | "history" | "profile";

type AccountPageProps = {
  initialPois: Poi[];
  initialRegions: Region[];
  initialCountries: Country[];
  initialAreas: Area[];
  initialSiteSettings: SiteSettings;
  // True when rendered inside the native app-shell (see AppShellRouter)
  // instead of as the standalone /account page.
  isEmbedded?: boolean;
};

export function AccountPage({
  initialPois,
  initialRegions,
  initialCountries,
  initialAreas,
  initialSiteSettings,
  isEmbedded = false
}: AccountPageProps) {
  const router = useRouter();
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);
  const storeSiteSettings = useExplorerStore((state) => state.siteSettings);
  const requestAuthFormOpen = useExplorerStore((state) => state.requestAuthFormOpen);

  useHydrateAuth();

  useEffect(() => {
    // Embedded in the native shell, the map screen already bootstrapped this
    // data into the store — seeding from (empty) placeholder props here would
    // stomp it.
    if (isEmbedded) {
      return;
    }
    setCountries(initialCountries);
    setAreas(initialAreas);
    setRegions(initialRegions);
    setPois(initialPois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goToMap() {
    if (isEmbedded) {
      navigateShell("map");
      return;
    }
    router.push("/");
  }

  function goToLogin() {
    if (isEmbedded) {
      navigateShell("map");
      requestAuthFormOpen();
      return;
    }
    router.push("/");
  }

  const effectiveSiteSettings = isEmbedded ? (storeSiteSettings ?? initialSiteSettings) : initialSiteSettings;

  const isNative = useIsNativeApp();
  const language = useExplorerStore((state) => state.language);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const clearViewedPois = useExplorerStore((state) => state.clearViewedPois);
  const clearFavoritePois = useExplorerStore((state) => state.clearFavoritePois);
  const clearVisitedPois = useExplorerStore((state) => state.clearVisitedPois);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

  const dict = getTranslations(language);
  const t = dict.auth;
  const { isAvatarPickerOpen, setIsAvatarPickerOpen, handleSelectAvatar } = useAvatarPicker();
  const [pendingClear, setPendingClear] = useState<"saved" | "visited" | "viewed" | "itinerary" | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTab>("route");

  const shellAccountTab = useShellNavigation().accountTab;

  useEffect(() => {
    if (isEmbedded) {
      setActiveTab(shellAccountTab);
      return;
    }
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "saved" || tab === "history" || tab === "route" || tab === "profile") {
      setActiveTab(tab);
    }
    return subscribeAccountTabChange(setActiveTab);
  }, [isEmbedded, shellAccountTab]);

  function handleGoToGenerateItinerary() {
    setActiveTab("route");
    setIsGeneratorOpen(true);
  }

  async function handleClearItinerary() {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  function goToPoi(poiId: string) {
    selectPoiFromMap(poiId);
    goToMap();
  }

  async function confirmPendingClear() {
    if (pendingClear === "saved") {
      clearFavoritePois();
    } else if (pendingClear === "visited") {
      clearVisitedPois();
    } else if (pendingClear === "viewed") {
      clearViewedPois();
    } else if (pendingClear === "itinerary") {
      await handleClearItinerary();
    }
    setPendingClear(null);
  }

  const pendingClearMessage =
    pendingClear === "saved"
      ? t.clearSavedConfirm
      : pendingClear === "visited"
        ? t.clearVisitedConfirm
        : pendingClear === "viewed"
          ? t.clearViewedConfirm
          : pendingClear === "itinerary"
            ? t.clearItineraryConfirm
            : null;

  const pendingClearLabel =
    pendingClear === "saved"
      ? t.clearSaved
      : pendingClear === "visited"
        ? t.clearVisited
        : pendingClear === "itinerary"
          ? t.clearItinerary
          : t.clearViewed;

  if (authStatus === "loading") {
    return (
      <main className="flex min-h-dvh flex-col bg-muted">
        <SiteHeader />
      </main>
    );
  }

  if (authStatus === "guest") {
    return (
      <main className="flex min-h-dvh flex-col bg-muted">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">{t.loginTitle}</p>
          <Button onClick={goToLogin}>{t.login}</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-muted">
      <SiteHeader />
      <div
        className="flex-1 px-6 py-10"
        style={isNative ? { paddingBottom: "calc(56px + env(safe-area-inset-bottom))" } : undefined}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            {!(activeTab === "profile" && currentUser) && (
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <ProfileAvatar avatarId={currentUser?.avatarId} className="h-14 w-14" />
                  <button
                    type="button"
                    onClick={() => setIsAvatarPickerOpen((value) => !value)}
                    className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {t.changeAvatar}
                  </button>
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">{currentUser?.name || currentUser?.email}</h1>
                  {currentUser && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.memberSince} {new Date(currentUser.createdAt).toLocaleDateString(language)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="ml-auto flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {dict.app.language}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          {isAvatarPickerOpen && !(activeTab === "profile" && currentUser) && (
            <AvatarPickerPanel title={t.chooseAvatar} currentAvatarId={currentUser?.avatarId} onSelect={handleSelectAvatar} />
          )}

          {activeTab !== "profile" && (
            <div className="flex gap-1.5 rounded-lg border border-border bg-card/[0.62] p-1">
              {(
                [
                  { id: "route", label: t.tabRoute },
                  { id: "saved", label: t.tabSaved },
                  { id: "history", label: t.tabHistory },
                  { id: "profile", label: t.tabProfile }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-semibold transition",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === "profile" && <ProfileTab />}

          <SavedTab
            isActive={activeTab === "saved"}
            requestClear={setPendingClear}
            goToPoi={goToPoi}
            goToMap={goToMap}
            onGenerateItinerary={handleGoToGenerateItinerary}
            siteSettings={effectiveSiteSettings}
          />

          <RouteTab
            isActive={activeTab === "route"}
            requestClear={setPendingClear}
            goToPoi={goToPoi}
            isGeneratorOpen={isGeneratorOpen}
            setIsGeneratorOpen={setIsGeneratorOpen}
            siteSettings={effectiveSiteSettings}
          />

          <HistoryTab isActive={activeTab === "history"} requestClear={setPendingClear} goToPoi={goToPoi} />
        </div>
      </div>

      {pendingClear && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setPendingClear(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-panel">
            <p className="text-sm text-foreground">{pendingClearMessage}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingClear(null)}>
                {t.cancel}
              </Button>
              <Button type="button" size="sm" onClick={confirmPendingClear}>
                {pendingClearLabel}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
