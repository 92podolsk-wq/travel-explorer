"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Check, Download, Pencil, Plus, Route, Search, Share2, Trash2, UserPlus, Wand2, X } from "lucide-react";
import { fuzzyMatch } from "@/shared/lib/fuzzy-match";
import type { Poi } from "@/entities/poi/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { FriendUser } from "@/entities/user/model/types";
import type { ItineraryShareRole } from "@/entities/sharing/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { cn } from "@/shared/lib/cn";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useItineraryStopMutations } from "@/shared/model/use-itinerary-stop-mutations";
import { useShareItinerary } from "@/shared/model/use-share-itinerary";
import { useItineraryRealtime } from "@/shared/realtime/useItineraryRealtime";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { ItineraryDaysBoard } from "./itinerary-days-board";

// isGeneratorOpen/setIsGeneratorOpen stay a prop rather than local state:
// the saved-tab CTA's "Составить маршрут" button also opens this panel
// (see AccountPage's handleGoToGenerateItinerary), so the parent needs to
// be able to flip it too. requestClear likewise stays a prop since the
// confirm-clear dialog (and handleClearItinerary itself) is shared 3-way
// with the saved/history tabs and lives in AccountPage.
export function RouteTab({
  isActive,
  requestClear,
  goToPoi,
  isGeneratorOpen,
  setIsGeneratorOpen,
  siteSettings
}: {
  isActive: boolean;
  requestClear: (kind: "itinerary") => void;
  goToPoi: (poiId: string) => void;
  isGeneratorOpen: boolean;
  setIsGeneratorOpen: Dispatch<SetStateAction<boolean>>;
  siteSettings: SiteSettings;
}) {
  const language = useExplorerStore((state) => state.language);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const currentUser = useExplorerStore((state) => state.currentUser);
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

  const { itineraryPoiIds, handleAddToItinerary } = useItineraryStopMutations();
  const { handleShareItinerary, isLinkCopied } = useShareItinerary();

  const t = getTranslations(language).auth;
  const dict = getTranslations(language);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [generatorRegionId, setGeneratorRegionId] = useState("");
  const [generatorDays, setGeneratorDays] = useState("2");
  const [generatorHoursPerDay, setGeneratorHoursPerDay] = useState("6");
  const [generatorSource, setGeneratorSource] = useState<"favorites" | "recommended">("favorites");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [addStopQuery, setAddStopQuery] = useState("");
  const [isFriendShareOpen, setIsFriendShareOpen] = useState(false);
  const [shareFriends, setShareFriends] = useState<FriendUser[]>([]);
  const [itineraryShareRoles, setItineraryShareRoles] = useState<Map<string, ItineraryShareRole>>(new Map());
  const [pendingItineraryShareId, setPendingItineraryShareId] = useState<string | null>(null);
  const [pendingDeleteItinerary, setPendingDeleteItinerary] = useState(false);

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

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

  return (
    <section className={cn("flex flex-col gap-3", !isActive && "hidden")}>
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
                <ProfileAvatar key={u.id} avatarId={u.avatarId} className="h-6 w-6 rounded-full border-2 border-card" />
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
                onClick={() => requestClear("itinerary")}
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
                    <span className="truncate text-xs font-medium text-foreground">{friend.name || `@${friend.username}`}</span>
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

      <ItineraryDaysBoard goToPoi={goToPoi} onAddLocation={() => setIsAddStopOpen(true)} siteSettings={siteSettings} />

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
    </section>
  );
}
