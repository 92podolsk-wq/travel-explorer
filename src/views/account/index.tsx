"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  Pencil,
  Plus,
  Route,
  Search,
  Share2,
  Trash2,
  UserPlus,
  Wand2,
  X
} from "lucide-react";
import { fuzzyMatch } from "@/shared/lib/fuzzy-match";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import type { FriendUser, User } from "@/entities/user/model/types";
import type { ItineraryShareRole } from "@/entities/sharing/model/types";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useItineraryRealtime } from "@/shared/realtime/useItineraryRealtime";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { useItineraryStopMutations } from "@/shared/model/use-itinerary-stop-mutations";
import { useShareItinerary } from "@/shared/model/use-share-itinerary";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { subscribeAccountTabChange } from "@/shared/lib/account-tab-navigation";
import { navigateShell, useShellNavigation } from "@/shared/lib/shell-navigation";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { cn } from "@/shared/lib/cn";
import { FavoritesMap } from "@/widgets/favorites-map/ui/favorites-map";
import { HistoryTab } from "@/widgets/history-tab/ui/history-tab";
import { SavedTab } from "@/widgets/saved-tab/ui/saved-tab";
import { ItineraryDaysBoard } from "@/widgets/route-tab/ui/itinerary-days-board";
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
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleVisited = useExplorerStore((state) => state.toggleVisited);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const clearViewedPois = useExplorerStore((state) => state.clearViewedPois);
  const clearFavoritePois = useExplorerStore((state) => state.clearFavoritePois);
  const clearVisitedPois = useExplorerStore((state) => state.clearVisitedPois);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const itineraries = useExplorerStore((state) => state.itineraries);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const activeItineraryId = useExplorerStore((state) => state.activeItineraryId);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);

  // Live updates for collaborative trip editing (a companion's mutation
  // broadcasts over a WebSocket to /realtime — see server.mts + src/shared/
  // server/realtime.ts) and presence (who else currently has this trip
  // open) are handled by useItineraryRealtime.
  const presenceUsers = useItineraryRealtime(itinerary?.id, setItinerary);
  const otherPresenceUsers = presenceUsers.filter((u) => u.id !== currentUser?.id);

  const dict = getTranslations(language);
  const t = dict.auth;
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [pendingClear, setPendingClear] = useState<"saved" | "visited" | "viewed" | "itinerary" | null>(null);
  const [pendingDeleteItinerary, setPendingDeleteItinerary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorRegionId, setGeneratorRegionId] = useState("");
  const [generatorDays, setGeneratorDays] = useState("2");
  const [generatorHoursPerDay, setGeneratorHoursPerDay] = useState("6");
  const [generatorSource, setGeneratorSource] = useState<"favorites" | "recommended">("favorites");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
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

  const { itineraryPoiIds, handleAddToItinerary } = useItineraryStopMutations();
  const { handleShareItinerary, isLinkCopied } = useShareItinerary();

  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [addStopQuery, setAddStopQuery] = useState("");

  function poiDisplayName(poi: Poi) {
    return poi.nameByLanguage?.[language] ?? poi.name;
  }

  const addStopSections = useMemo(() => {
    const query = addStopQuery.trim().toLowerCase();
    const filtered = query.length > 0 ? pois.filter((poi) => fuzzyMatch(poiDisplayName(poi), query)) : pois;
    const byRegion = new Map<string, Poi[]>();
    for (const poi of filtered) {
      const list = byRegion.get(poi.regionId);
      if (list) list.push(poi);
      else byRegion.set(poi.regionId, [poi]);
    }
    return Array.from(byRegion.entries())
      .map(([regionId, regionPois]) => ({
        regionId,
        name: regionName(regionId),
        pois: [...regionPois].sort((a, b) => poiDisplayName(a).localeCompare(poiDisplayName(b)))
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pois, addStopQuery, language]);

  function clampDayCount(raw: string) {
    const parsed = Number(raw);
    if (!raw.trim() || Number.isNaN(parsed)) return 1;
    return Math.min(14, Math.max(1, Math.round(parsed)));
  }

  function handleGoToGenerateItinerary() {
    setActiveTab("route");
    setIsGeneratorOpen(true);
  }

  async function handleClearItinerary() {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleGenerateItinerary() {
    if (!generatorRegionId || !itinerary) return;
    if (itinerary.stops.length > 0 && !window.confirm(t.generateItineraryConfirm)) {
      return;
    }

    setGeneratorError(null);
    setIsGenerating(true);
    try {
      const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId: generatorRegionId,
          days: clampDayCount(generatorDays),
          hoursPerDay: clampDayCount(generatorHoursPerDay),
          source: generatorSource,
          language
        })
      });

      if (!res.ok) {
        setGeneratorError(t.generateItineraryEmpty);
        return;
      }

      const result = await res.json();
      if (result.stops.length === 0) {
        setGeneratorError(t.generateItineraryEmpty);
        return;
      }

      setItinerary(result);
      setItineraries(itineraries.map((i) => (i.id === result.id ? { id: result.id, title: result.title } : i)));
      setIsGeneratorOpen(false);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownloadPdf() {
    if (!itinerary) return;
    window.open(`/trip/${itinerary.shareToken}?print=1`, "_blank");
  }

  async function handleRenameItinerary(newTitle: string) {
    const trimmed = newTitle.trim();
    setIsEditingTitle(false);
    if (!trimmed || !itinerary || trimmed === itinerary.title) return;

    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed })
    });
    if (res.ok) {
      const result = await res.json();
      setItinerary(result);
      setItineraries(itineraries.map((i) => (i.id === result.id ? { id: result.id, title: result.title } : i)));
    }
  }

  const [isFriendShareOpen, setIsFriendShareOpen] = useState(false);
  const [shareFriends, setShareFriends] = useState<FriendUser[]>([]);
  const [itineraryShareRoles, setItineraryShareRoles] = useState<Map<string, ItineraryShareRole>>(new Map());
  const [pendingItineraryShareId, setPendingItineraryShareId] = useState<string | null>(null);

  function openItineraryFriendShare() {
    if (!itinerary) return;
    setIsFriendShareOpen((value) => !value);
    if (shareFriends.length === 0) {
      apiFetch("/api/me/friends")
        .then((res) => res.json())
        .then((body: { friends: { user: FriendUser }[] }) => setShareFriends(body.friends.map((entry) => entry.user)));
    }
    apiFetch(`/api/me/itineraries/${itinerary.id}/shares`)
      .then((res) => res.json())
      .then((body: { users: (FriendUser & { role: ItineraryShareRole })[] }) =>
        setItineraryShareRoles(new Map(body.users.map((user) => [user.id, user.role])))
      );
  }

  async function shareItineraryWithRole(friendId: string, role: ItineraryShareRole) {
    if (!itinerary) return;
    await apiFetch(`/api/me/itineraries/${itinerary.id}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendUserId: friendId, role })
    });
    setItineraryShareRoles((prev) => new Map(prev).set(friendId, role));
  }

  async function toggleItineraryShare(friendId: string, isShared: boolean) {
    if (!itinerary) return;
    setPendingItineraryShareId(friendId);
    try {
      if (isShared) {
        await apiFetch(`/api/me/itineraries/${itinerary.id}/shares/${friendId}`, { method: "DELETE" });
        setItineraryShareRoles((prev) => {
          const next = new Map(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        await shareItineraryWithRole(friendId, "viewer");
      }
    } finally {
      setPendingItineraryShareId(null);
    }
  }

  async function toggleItineraryShareRole(friendId: string, role: ItineraryShareRole) {
    setPendingItineraryShareId(friendId);
    try {
      await shareItineraryWithRole(friendId, role);
    } finally {
      setPendingItineraryShareId(null);
    }
  }

  async function handleSwitchItinerary(id: string) {
    setActiveItineraryId(id);
    const res = await apiFetch(`/api/me/itineraries/${id}`);
    if (res.ok) setItinerary(await res.json());
  }

  async function handleCreateItinerary() {
    if (itineraries.length >= 3) return;
    const res = await apiFetch("/api/me/itineraries", { method: "POST" });
    if (res.ok) {
      const created = await res.json();
      setItineraries([...itineraries, { id: created.id, title: created.title }]);
      setActiveItineraryId(created.id);
      setItinerary(created);
    }
  }

  async function handleDeleteItinerary() {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = itineraries.filter((i) => i.id !== itinerary.id);
      setItineraries(remaining);
      const nextId = remaining[0]?.id ?? null;
      setActiveItineraryId(nextId);
      if (nextId) {
        const nextRes = await apiFetch(`/api/me/itineraries/${nextId}`);
        setItinerary(nextRes.ok ? await nextRes.json() : null);
      } else {
        setItinerary(null);
      }
    }
    setPendingDeleteItinerary(false);
  }

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
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
            <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
              <h2 className="text-sm font-semibold text-foreground">{t.chooseAvatar}</h2>
              <div className="grid grid-cols-6 gap-3">
                {avatarIds.map((avatarId) => {
                  const isSelected = currentUser?.avatarId === avatarId;
                  return (
                    <button
                      key={avatarId}
                      type="button"
                      onClick={() => handleSelectAvatar(avatarId)}
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

          <section className={cn("flex flex-col gap-3", activeTab !== "route" && "hidden")}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Route className="h-4 w-4 shrink-0 text-primary" />
                {isEditingTitle ? (
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => handleRenameItinerary(titleDraft)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameItinerary(titleDraft);
                      if (e.key === "Escape") {
                        setTitleDraft(itinerary?.title ?? "");
                        setIsEditingTitle(false);
                      }
                    }}
                    className="rounded border border-primary/30 bg-card px-1.5 py-0.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/25"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setTitleDraft(itinerary?.title ?? "");
                      setIsEditingTitle(true);
                    }}
                    className="flex items-center gap-1 transition hover:text-primary"
                  >
                    {itinerary?.title || t.myItinerary}
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </h2>
              <div className="flex items-center gap-3">
                {otherPresenceUsers.length > 0 && (
                  <div className="flex items-center -space-x-1.5" title={otherPresenceUsers.map((u) => u.name || `@${u.username}`).join(", ")}>
                    {otherPresenceUsers.slice(0, 4).map((u) => (
                      <ProfileAvatar
                        key={u.id}
                        avatarId={u.avatarId}
                        className="h-6 w-6 rounded-full border-2 border-card"
                      />
                    ))}
                  </div>
                )}
                {regions.length > 0 && itinerary && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!generatorRegionId) setGeneratorRegionId(regions[0]?.id ?? "");
                      setIsGeneratorOpen((value) => !value);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    <Wand2 className="h-3 w-3" />
                    {t.generateItinerary}
                  </button>
                )}
                {itinerary && itinerary.stops.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      {t.downloadPdf}
                    </button>
                    <button
                      type="button"
                      onClick={handleShareItinerary}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <Share2 className="h-3 w-3" />
                      {isLinkCopied ? t.linkCopied : t.shareItinerary}
                    </button>
                    <button
                      type="button"
                      onClick={openItineraryFriendShare}
                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      <UserPlus className="h-3 w-3" />
                      {t.shareItineraryWithFriend}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingClear("itinerary")}
                      className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t.clearItinerary}
                    </button>
                  </>
                )}
              </div>
            </div>

            {isFriendShareOpen && itinerary && (
              <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
                {shareFriends.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t.friendsEmpty}</p>
                ) : (
                  shareFriends.map((friend) => {
                    const role = itineraryShareRoles.get(friend.id);
                    const isShared = role !== undefined;
                    return (
                      <div key={friend.id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <ProfileAvatar avatarId={friend.avatarId} className="h-6 w-6 shrink-0" />
                          <span className="truncate text-xs font-medium text-foreground">
                            {friend.name || `@${friend.username}`}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isShared && (
                            <button
                              type="button"
                              onClick={() => void toggleItineraryShareRole(friend.id, role === "editor" ? "viewer" : "editor")}
                              disabled={pendingItineraryShareId === friend.id}
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60",
                                role === "editor"
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {t.itineraryShareCanEdit}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void toggleItineraryShare(friend.id, isShared)}
                            disabled={pendingItineraryShareId === friend.id}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60",
                              isShared
                                ? "border border-border text-muted-foreground hover:text-foreground"
                                : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                          >
                            {isShared ? t.friendsRemove : t.friendsAdd}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {itineraries.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  aria-label={t.switchItinerary}
                  value={activeItineraryId ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      handleCreateItinerary();
                    } else {
                      handleSwitchItinerary(e.target.value);
                    }
                  }}
                  className="h-7 rounded border border-border bg-card px-1.5 text-xs outline-none"
                >
                  {itineraries.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                  <option value="__new__" disabled={itineraries.length >= 3}>
                    {itineraries.length >= 3 ? t.maxItinerariesReached : t.newItinerary}
                  </option>
                </select>
                {itinerary && itineraries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteItinerary(true)}
                    title={t.deleteItinerary}
                    className="text-muted-foreground transition hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {isGeneratorOpen && (
              <div className="flex flex-col gap-2.5 rounded-md border border-border bg-card/[0.78] p-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={generatorRegionId}
                    onChange={(e) => setGeneratorRegionId(e.target.value)}
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm outline-none"
                  >
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {regionName(region.id)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={generatorSource}
                    onChange={(e) => setGeneratorSource(e.target.value as "favorites" | "recommended")}
                    className="h-9 rounded-md border border-border bg-card px-2 text-sm outline-none"
                  >
                    <option value="favorites">{t.generateItinerarySourceFavorites}</option>
                    <option value="recommended">{t.generateItinerarySourceRecommended}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
                    {t.generateItineraryDays}
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={generatorDays}
                      onChange={(e) => setGeneratorDays(e.target.value)}
                      onBlur={() => setGeneratorDays(String(clampDayCount(generatorDays)))}
                      className="h-9 w-16 rounded-md border border-border bg-card px-2 text-sm outline-none"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground">
                    {t.generateItineraryHoursPerDay}
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={generatorHoursPerDay}
                      onChange={(e) => setGeneratorHoursPerDay(e.target.value)}
                      onBlur={() => setGeneratorHoursPerDay(String(clampDayCount(generatorHoursPerDay)))}
                      className="h-9 w-16 rounded-md border border-border bg-card px-2 text-sm outline-none"
                    />
                  </label>
                </div>
                {generatorError && <p className="text-xs font-medium text-red-600">{generatorError}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsGeneratorOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="button" onClick={handleGenerateItinerary} disabled={isGenerating}>
                    {t.generateItinerarySubmit}
                  </Button>
                </div>
              </div>
            )}

            <ItineraryDaysBoard goToPoi={goToPoi} onAddLocation={() => setIsAddStopOpen(true)} siteSettings={effectiveSiteSettings} />
          </section>

          <HistoryTab isActive={activeTab === "history"} requestClear={setPendingClear} goToPoi={goToPoi} />
        </div>
      </div>

      {isAddStopOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsAddStopOpen(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 flex max-h-[78vh] w-[24rem] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-border bg-card p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{t.addLocationTitle}</p>
              <button type="button" aria-label="Close" onClick={() => setIsAddStopOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                value={addStopQuery}
                onChange={(e) => setAddStopQuery(e.target.value)}
                placeholder={dict.app.searchPlaceholder}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {addStopSections.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">{t.addLocationEmpty}</p>
              ) : (
                addStopSections.map((section) => (
                  <div key={section.regionId} className="mb-2">
                    <p className="sticky top-0 bg-card py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {section.name}
                    </p>
                    {section.pois.map((poi) => {
                      const isAdded = itineraryPoiIds.has(poi.id);
                      return (
                        <button
                          key={poi.id}
                          type="button"
                          disabled={isAdded}
                          onClick={() => void handleAddToItinerary(poi.id)}
                          className="flex w-full items-center gap-2.5 rounded-md py-1.5 text-left disabled:opacity-50"
                        >
                          <span className="flex-1 truncate text-sm text-foreground">{poiDisplayName(poi)}</span>
                          {isAdded ? (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <Plus className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

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

      {pendingDeleteItinerary && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setPendingDeleteItinerary(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-panel">
            <p className="text-sm text-foreground">{t.deleteItineraryConfirm}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingDeleteItinerary(false)}>
                {t.cancel}
              </Button>
              <Button type="button" size="sm" onClick={handleDeleteItinerary}>
                {t.deleteItinerary}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
