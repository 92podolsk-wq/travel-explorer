"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Check,
  ChevronDown,
  Download,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Route,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import { computeItinerarySummary } from "@/entities/itinerary/model/summary";
import { buildDayTimeline, formatMinutesAsTime } from "@/entities/itinerary/model/timeline";
import type { ItineraryStopWithPoi } from "@/entities/itinerary/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import type { User } from "@/entities/user/model/types";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";

type Translations = ReturnType<typeof getTranslations>;
import { estimateTransitionMinutes, sequenceByNearestNeighbor } from "@/shared/lib/itinerary-planner";
import { formatDistance, haversineDistanceMeters } from "@/shared/lib/geo";
import { fetchWalkingRoute, type WalkingRoute } from "@/shared/lib/osrm-route";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { cn } from "@/shared/lib/cn";
import { ItineraryDayMap } from "@/widgets/itinerary-day-map/ui/itinerary-day-map";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

const DAY_START_MINUTES = 540; // 09:00

type AccountPageProps = {
  initialPois: Poi[];
  initialRegions: Region[];
  initialCountries: Country[];
  initialAreas: Area[];
  initialSiteSettings: SiteSettings;
};

function PoiThumbnail({ poi, className }: { poi: Poi; className?: string }) {
  const thumbnail = poi.photos[0]?.url;

  return thumbnail ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbnail} alt={poi.name} className={cn("shrink-0 rounded object-cover", className)} />
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground", className)}>
      <MapPin className="h-5 w-5" />
    </div>
  );
}

function PoiRow({
  poi,
  regionName,
  onSelect,
  action
}: {
  poi: Poi;
  regionName: string;
  onSelect: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-md border border-border bg-white/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60">
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PoiThumbnail poi={poi} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{poi.name}</p>
          <p className="truncate text-xs text-muted-foreground">{regionName}</p>
        </div>
      </button>
      {action}
    </div>
  );
}

function ItineraryTimelineRow({
  stop,
  arrivalMinutes,
  departureMinutes,
  regionName,
  onSelect,
  onRemove,
  onMoveToDay,
  maxDay,
  t
}: {
  stop: ItineraryStopWithPoi;
  arrivalMinutes: number;
  departureMinutes: number;
  regionName: string;
  onSelect: () => void;
  onRemove: () => void;
  onMoveToDay: (day: number) => void;
  maxDay: number;
  t: Translations["auth"];
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-white/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60">
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <PoiThumbnail poi={stop.poi} className="h-12 w-12" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{stop.poi.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {formatMinutesAsTime(arrivalMinutes)}–{formatMinutesAsTime(departureMinutes)} · {regionName}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <select
          value={stop.day}
          onChange={(e) => onMoveToDay(Number(e.target.value))}
          className="h-7 rounded border border-border bg-white px-1 text-xs outline-none"
        >
          {Array.from({ length: maxDay + 1 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {t.dayLabel.replace("{n}", String(d))}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.removeFromItinerary}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ItineraryDayCard({
  day,
  title,
  stops,
  route,
  mapStyleId,
  protomapsPmtilesUrl,
  onRenameDay,
  onOptimizeDay,
  isOptimizing,
  onRequestRemoveDay,
  regionName,
  goToPoi,
  onRemoveStop,
  onMoveStopToDay,
  maxDay,
  t,
  dict,
  defaultExpanded
}: {
  day: number;
  title: string | null;
  stops: ItineraryStopWithPoi[];
  route: WalkingRoute | null;
  mapStyleId: SiteSettings["mapStyleId"];
  protomapsPmtilesUrl: string | null;
  onRenameDay: (title: string) => void;
  onOptimizeDay: () => void;
  isOptimizing: boolean;
  onRequestRemoveDay: () => void;
  regionName: (regionId: string) => string;
  goToPoi: (poiId: string) => void;
  onRemoveStop: (poiId: string) => void;
  onMoveStopToDay: (poiId: string, day: number) => void;
  maxDay: number;
  t: Translations["auth"];
  dict: Translations;
  defaultExpanded: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title ?? "");

  const pois = stops.map((stop) => stop.poi);
  const summary = computeItinerarySummary(pois);

  const { entries, endMinutes } = useMemo(() => {
    if (pois.length === 0) {
      return { entries: [], endMinutes: DAY_START_MINUTES };
    }
    const legMinutes =
      route?.legDurationsMinutes ??
      pois.slice(0, -1).map((poi, i) => estimateTransitionMinutes(haversineDistanceMeters(poi.coordinates, pois[i + 1].coordinates)));
    return buildDayTimeline(pois, legMinutes, DAY_START_MINUTES);
  }, [pois, route]);

  const displayTitle = title || t.dayLabel.replace("{n}", String(day));

  return (
    <div className="rounded-lg border border-border bg-white/[0.78] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                onRenameDay(titleDraft);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false);
                  onRenameDay(titleDraft);
                }
                if (e.key === "Escape") {
                  setTitleDraft(title ?? "");
                  setIsEditingTitle(false);
                }
              }}
              placeholder={t.renameDayPlaceholder}
              className="w-full rounded border border-primary/30 bg-white px-1.5 py-0.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/25"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleDraft(title ?? "");
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground transition hover:text-primary"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.dayLabel.replace("{n}", String(day))}
              </span>
              {displayTitle}
              <Pencil className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t.dayPlaceCount.replace("{count}", String(pois.length))}
            {pois.length > 0 && (
              <>
                {" · "}
                {t.dayWalkingDistance.replace("{distance}", formatDistance(summary.walkingDistanceMeters))}
                {" · "}
                {summary.totalMinutes} {dict.app.minutesShort}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {pois.length > 1 && (
            <button
              type="button"
              onClick={onOptimizeDay}
              disabled={isOptimizing}
              title={t.optimizeDay}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:text-primary disabled:opacity-40"
            >
              <Sparkles className={cn("h-4 w-4", isOptimizing && "animate-pulse")} />
            </button>
          )}
          <button
            type="button"
            onClick={onRequestRemoveDay}
            title={t.removeDay}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:text-foreground"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 flex flex-col gap-3">
          {pois.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.dayEmptyPlaceholder}</p>
          ) : (
            <>
              <ItineraryDayMap
                stops={pois}
                lineCoordinates={route?.lineCoordinates ?? null}
                mapStyleId={mapStyleId}
                protomapsPmtilesUrl={protomapsPmtilesUrl}
              />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {formatMinutesAsTime(DAY_START_MINUTES)} {t.dayStart}
                </p>
                {entries.map((entry, index) => {
                  if (entry.type === "stop") {
                    const stop = stops.find((s) => s.poi.id === entry.poi.id);
                    if (!stop) return null;
                    return (
                      <ItineraryTimelineRow
                        key={stop.id}
                        stop={stop}
                        arrivalMinutes={entry.arrivalMinutes}
                        departureMinutes={entry.departureMinutes}
                        regionName={regionName(stop.poi.regionId)}
                        onSelect={() => goToPoi(stop.poi.id)}
                        onRemove={() => onRemoveStop(stop.poi.id)}
                        onMoveToDay={(targetDay) => onMoveStopToDay(stop.poi.id, targetDay)}
                        maxDay={maxDay}
                        t={t}
                      />
                    );
                  }

                  if (entry.type === "travel") {
                    return (
                      <p key={`travel-${index}`} className="pl-1 text-xs text-muted-foreground">
                        {entry.minutes} {dict.app.minutesShort} ({formatDistance(entry.meters)})
                      </p>
                    );
                  }

                  return (
                    <p
                      key={`lunch-${index}`}
                      className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700"
                    >
                      {formatMinutesAsTime(entry.startMinutes)} {t.lunchBreak} · {entry.minutes} {dict.app.minutesShort}
                    </p>
                  );
                })}
                <p className="text-xs font-medium text-muted-foreground">
                  {formatMinutesAsTime(endMinutes)} {t.dayEnd}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountPage({ initialPois, initialRegions, initialCountries, initialAreas, initialSiteSettings }: AccountPageProps) {
  const router = useRouter();
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);

  useHydrateAuth();

  useEffect(() => {
    setCountries(initialCountries);
    setAreas(initialAreas);
    setRegions(initialRegions);
    setPois(initialPois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const language = useExplorerStore((state) => state.language);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const clearViewedPois = useExplorerStore((state) => state.clearViewedPois);
  const clearFavoritePois = useExplorerStore((state) => state.clearFavoritePois);
  const clearVisitedPois = useExplorerStore((state) => state.clearVisitedPois);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const dict = getTranslations(language);
  const t = dict.auth;
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [pendingClear, setPendingClear] = useState<"saved" | "visited" | "viewed" | "itinerary" | null>(null);
  const [pendingRemoveDay, setPendingRemoveDay] = useState<number | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [generatorRegionId, setGeneratorRegionId] = useState("");
  const [generatorDays, setGeneratorDays] = useState("2");
  const [generatorHoursPerDay, setGeneratorHoursPerDay] = useState("6");
  const [generatorSource, setGeneratorSource] = useState<"favorites" | "recommended">("favorites");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [dayRoutes, setDayRoutes] = useState<Record<number, WalkingRoute | null>>({});
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [optimizingDay, setOptimizingDay] = useState<number | null>(null);

  const itineraryPoiIds = new Set((itinerary?.stops ?? []).map((stop) => stop.poi.id));

  function clampDayCount(raw: string) {
    const parsed = Number(raw);
    if (!raw.trim() || Number.isNaN(parsed)) return 1;
    return Math.min(14, Math.max(1, Math.round(parsed)));
  }

  async function handleAddToItinerary(poiId: string) {
    const res = await fetch("/api/me/itinerary/stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleAddAllToItinerary() {
    const poiIds = favoritePois.filter((poi) => !itineraryPoiIds.has(poi.id)).map((poi) => poi.id);
    if (poiIds.length === 0) return;
    const res = await fetch("/api/me/itinerary/stops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleClearItinerary() {
    const res = await fetch("/api/me/itinerary/stops", { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRemoveFromItinerary(poiId: string) {
    const res = await fetch(`/api/me/itinerary/stops/${poiId}`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleMoveStopToDay(poiId: string, day: number) {
    const res = await fetch(`/api/me/itinerary/stops/${poiId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleReorderItinerary(day: number, orderedPoiIds: string[]) {
    const res = await fetch("/api/me/itinerary/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, orderedPoiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleOptimizeDay(day: number) {
    if (!itinerary) return;
    setOptimizingDay(day);
    try {
      const dayPois = itinerary.stops.filter((stop) => stop.day === day).map((stop) => stop.poi);
      const ordered = sequenceByNearestNeighbor(dayPois);
      await handleReorderItinerary(day, ordered.map((poi) => poi.id));
    } finally {
      setOptimizingDay(null);
    }
  }

  async function handleAddDay() {
    setIsAddingDay(true);
    try {
      const res = await fetch("/api/me/itinerary/days", { method: "POST" });
      if (res.ok) setItinerary(await res.json());
    } finally {
      setIsAddingDay(false);
    }
  }

  async function handleRemoveDay(day: number) {
    const res = await fetch(`/api/me/itinerary/days/${day}`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRenameDay(day: number, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/me/itinerary/days/${day}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleGenerateItinerary() {
    if (!generatorRegionId) return;
    if (itinerary && itinerary.stops.length > 0 && !window.confirm(t.generateItineraryConfirm)) {
      return;
    }

    setGeneratorError(null);
    setIsGenerating(true);
    try {
      const res = await fetch("/api/me/itinerary/generate", {
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

    const res = await fetch("/api/me/itinerary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleShareItinerary() {
    if (!itinerary) return;
    const url = `${window.location.origin}/trip/${itinerary.shareToken}`;
    await navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  }

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  function goToPoi(poiId: string) {
    selectPoiFromMap(poiId);
    router.push("/");
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
    const res = await fetch("/api/me/avatar", {
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

  const daySignature = itinerary
    ? itinerary.days
        .map((d) => `${d.day}:${itinerary.stops.filter((s) => s.day === d.day).map((s) => s.poi.id).join(",")}`)
        .join("|")
    : "";

  useEffect(() => {
    if (!itinerary || itinerary.days.length === 0) {
      setDayRoutes({});
      return;
    }

    let cancelled = false;

    (async () => {
      const entries = await Promise.all(
        itinerary.days.map(async (d) => {
          const dayPois = itinerary.stops.filter((s) => s.day === d.day).map((s) => s.poi);
          if (dayPois.length < 2) return [d.day, null] as const;
          const route = await fetchWalkingRoute(dayPois.map((poi) => poi.coordinates));
          return [d.day, route] as const;
        })
      );
      if (!cancelled) setDayRoutes(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daySignature]);

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
          <Button onClick={() => router.push("/")}>{t.login}</Button>
        </div>
      </main>
    );
  }

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
  const viewedPois = pois.filter((poi) => viewedPoiIds.includes(poi.id));
  const visitedPois = pois.filter((poi) => visitedPoiIds.includes(poi.id));
  const maxDay = itinerary && itinerary.days.length > 0 ? Math.max(...itinerary.days.map((d) => d.day)) : 0;

  return (
    <main className="flex min-h-dvh flex-col bg-muted">
      <SiteHeader />
      <div className="flex-1 px-6 py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
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
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {dict.app.language}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          {isAvatarPickerOpen && (
            <section className="flex flex-col gap-3 rounded-md border border-border bg-white/[0.78] p-4">
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

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Bookmark className="h-4 w-4 text-primary" />
                {t.savedPlaces}
              </h2>
              {favoritePois.length > 0 && (
                <div className="flex items-center gap-3">
                  {favoritePois.some((poi) => !itineraryPoiIds.has(poi.id)) && (
                    <button
                      type="button"
                      onClick={handleAddAllToItinerary}
                      className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {t.addAllToItinerary}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingClear("saved")}
                    className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {t.clearSaved}
                  </button>
                </div>
              )}
            </div>
            {favoritePois.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noSavedPlaces}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {favoritePois.map((poi) => {
                  const isInItinerary = itineraryPoiIds.has(poi.id);
                  return (
                    <PoiRow
                      key={poi.id}
                      poi={poi}
                      regionName={regionName(poi.regionId)}
                      onSelect={() => goToPoi(poi.id)}
                      action={
                        <button
                          type="button"
                          onClick={() =>
                            isInItinerary ? handleRemoveFromItinerary(poi.id) : handleAddToItinerary(poi.id)
                          }
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition",
                            isInItinerary
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {isInItinerary ? t.inItinerary : t.addToItinerary}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
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
                    className="rounded border border-primary/30 bg-white px-1.5 py-0.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/25"
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
                {regions.length > 0 && (
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
                      onClick={() => setPendingClear("itinerary")}
                      className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t.clearItinerary}
                    </button>
                  </>
                )}
              </div>
            </div>

            {isGeneratorOpen && (
              <div className="flex flex-col gap-2.5 rounded-md border border-border bg-white/[0.78] p-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={generatorRegionId}
                    onChange={(e) => setGeneratorRegionId(e.target.value)}
                    className="h-9 rounded-md border border-border bg-white px-2 text-sm outline-none"
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
                    className="h-9 rounded-md border border-border bg-white px-2 text-sm outline-none"
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
                      className="h-9 w-16 rounded-md border border-border bg-white px-2 text-sm outline-none"
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
                      className="h-9 w-16 rounded-md border border-border bg-white px-2 text-sm outline-none"
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

            {!itinerary || itinerary.days.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.itineraryEmpty}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {itinerary.days.map((dayInfo, index) => (
                  <ItineraryDayCard
                    key={dayInfo.day}
                    day={dayInfo.day}
                    title={dayInfo.title}
                    stops={itinerary.stops.filter((stop) => stop.day === dayInfo.day)}
                    route={dayRoutes[dayInfo.day] ?? null}
                    mapStyleId={initialSiteSettings.mapStyleId}
                    protomapsPmtilesUrl={initialSiteSettings.protomapsPmtilesUrl}
                    onRenameDay={(title) => handleRenameDay(dayInfo.day, title)}
                    onOptimizeDay={() => handleOptimizeDay(dayInfo.day)}
                    isOptimizing={optimizingDay === dayInfo.day}
                    onRequestRemoveDay={() => setPendingRemoveDay(dayInfo.day)}
                    regionName={regionName}
                    goToPoi={goToPoi}
                    onRemoveStop={handleRemoveFromItinerary}
                    onMoveStopToDay={handleMoveStopToDay}
                    maxDay={maxDay}
                    t={t}
                    dict={dict}
                    defaultExpanded={index === 0}
                  />
                ))}
                <Button type="button" variant="outline" onClick={handleAddDay} disabled={isAddingDay} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t.addDay}
                </Button>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {t.visitedPlaces}
              </h2>
              {visitedPois.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingClear("visited")}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.clearVisited}
                </button>
              )}
            </div>
            {visitedPois.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noVisitedPlaces}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visitedPois.map((poi) => (
                  <PoiRow key={poi.id} poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                {t.viewedPlaces}
              </h2>
              {viewedPois.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPendingClear("viewed")}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.clearViewed}
                </button>
              )}
            </div>
            {viewedPois.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noViewedPlaces}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {viewedPois.map((poi) => (
                  <PoiRow key={poi.id} poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
                ))}
              </div>
            )}
          </section>
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
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-panel">
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

      {pendingRemoveDay !== null && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setPendingRemoveDay(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-panel">
            <p className="text-sm text-foreground">{t.removeDayConfirm}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingRemoveDay(null)}>
                {t.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  await handleRemoveDay(pendingRemoveDay);
                  setPendingRemoveDay(null);
                }}
              >
                {t.removeDay}
              </Button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
