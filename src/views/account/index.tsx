"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  GripVertical,
  Info,
  ListPlus,
  Map as MapIcon,
  MapPin,
  Pencil,
  Plus,
  Route,
  Share2,
  Sparkles,
  Trash2,
  UserPlus,
  Wand2,
  X
} from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import { computeItinerarySummary } from "@/entities/itinerary/model/summary";
import {
  LUNCH_DURATION_MINUTES,
  LUNCH_THRESHOLD_MINUTES,
  buildDayTimeline,
  formatDurationLabel,
  formatMinutesAsTime,
  minutesToTimeInputValue,
  timeInputValueToMinutes
} from "@/entities/itinerary/model/timeline";
import type { ItineraryStopPoint, ItineraryStopWithPoi } from "@/entities/itinerary/model/types";
import {
  stopPointColor,
  stopPointCoordinates,
  stopPointId,
  stopPointName,
  stopPointRegionId
} from "@/entities/itinerary/model/stop-point";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import type { FriendUser, User } from "@/entities/user/model/types";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";

type Translations = ReturnType<typeof getTranslations>;
import { estimateTransitionMinutes, sequenceByNearestNeighbor } from "@/shared/lib/itinerary-planner";
import { formatDistance, haversineDistanceMeters } from "@/shared/lib/geo";
import { fetchWalkingRoute, type WalkingRoute } from "@/shared/lib/osrm-route";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { subscribeAccountTabChange } from "@/shared/lib/account-tab-navigation";
import { navigateShell, useShellNavigation } from "@/shared/lib/shell-navigation";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { cn } from "@/shared/lib/cn";
import { FavoritesMap } from "@/widgets/favorites-map/ui/favorites-map";
import { ItineraryDayMap } from "@/widgets/itinerary-day-map/ui/itinerary-day-map";
import { ProfileTab } from "@/widgets/profile-tab/ui/profile-tab";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

const DEFAULT_DAY_START_MINUTES = 540; // 09:00
const FAVORITES_TRIP_HOURS_PER_DAY = 6;

type DayConfigPatch = Partial<{
  title: string;
  startMinutes: number | null;
  lunchEnabled: boolean | null;
  lunchStartMinutes: number | null;
  lunchDurationMinutes: number | null;
}>;

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

function PoiThumbnail({ poi, className }: { poi: Poi; className?: string }) {
  const thumbnail = poi.photos[0]?.url;

  return thumbnail ? (
    <div className={cn("relative shrink-0 overflow-hidden rounded", className)}>
      <Image src={thumbnail} alt={poi.name} fill sizes="48px" className="object-cover" />
    </div>
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center rounded bg-muted text-muted-foreground", className)}>
      <MapPin className="h-5 w-5" />
    </div>
  );
}

function StopPointThumbnail({ point, className }: { point: ItineraryStopPoint; className?: string }) {
  if (point.kind === "poi") {
    return <PoiThumbnail poi={point.poi} className={className} />;
  }

  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded", className)}
      style={{ backgroundColor: stopPointColor(point) ?? "#7a7a7a" }}
    >
      <MapPin className="h-5 w-5 text-white" />
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
    <div className="flex w-full items-center gap-3 rounded-md border border-border bg-card/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60">
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
  language,
  arrivalMinutes,
  departureMinutes,
  durationMinutes,
  isDurationOverridden,
  regionName,
  onSelect,
  onRemove,
  onMoveToDay,
  onSetDuration,
  maxDay,
  t,
  dict
}: {
  stop: ItineraryStopWithPoi;
  language: Language;
  arrivalMinutes: number;
  departureMinutes: number;
  durationMinutes: number;
  isDurationOverridden: boolean;
  regionName: string;
  onSelect: () => void;
  onRemove: () => void;
  onMoveToDay: (day: number) => void;
  onSetDuration: (minutes: number | null) => void;
  maxDay: number;
  t: Translations["auth"];
  dict: Translations;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [departureDraft, setDepartureDraft] = useState(minutesToTimeInputValue(departureMinutes));

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  };

  function commitDeparture() {
    setIsEditingDuration(false);
    const departureValue = timeInputValueToMinutes(departureDraft);
    let newDuration = departureValue - (arrivalMinutes % 1440);
    if (newDuration <= 0) newDuration += 1440;
    onSetDuration(Math.min(600, Math.max(5, Math.round(newDuration))));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border bg-card/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag"
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onSelect} className="shrink-0">
        <StopPointThumbnail point={stop.point} className="h-12 w-12" />
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onSelect}
          className="block truncate text-left text-sm font-semibold text-foreground hover:text-primary"
        >
          {stopPointName(stop.point, language, dict.app.markerStopFallbackName)}
        </button>
        <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          <span>{formatMinutesAsTime(arrivalMinutes)}–</span>
          {isEditingDuration ? (
            <input
              autoFocus
              type="time"
              value={departureDraft}
              onChange={(e) => setDepartureDraft(e.target.value)}
              onBlur={commitDeparture}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDeparture();
                if (e.key === "Escape") {
                  setDepartureDraft(minutesToTimeInputValue(departureMinutes));
                  setIsEditingDuration(false);
                }
              }}
              className="h-6 rounded border border-primary/30 bg-card px-1 text-xs outline-none focus:ring-2 focus:ring-ring/25"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDepartureDraft(minutesToTimeInputValue(departureMinutes));
                setIsEditingDuration(true);
              }}
              className="hover:text-primary"
            >
              {formatMinutesAsTime(departureMinutes)}
            </button>
          )}
          {regionName && <span className="truncate">· {regionName}</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">
            {t.stopDuration}: {formatDurationLabel(durationMinutes, dict.app.hoursShort, dict.app.minutesShort)}
            {isDurationOverridden && ` · ${t.stopDurationCustom}`}
          </span>
          {isDurationOverridden && (
            <button
              type="button"
              onClick={() => onSetDuration(null)}
              title={t.resetDuration}
              className="text-[10px] text-muted-foreground underline-offset-2 hover:underline"
            >
              {t.resetDuration}
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <select
          value={stop.day}
          onChange={(e) => onMoveToDay(Number(e.target.value))}
          className="h-7 rounded border border-border bg-card px-1 text-xs outline-none"
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
  language,
  route,
  mapStyleId,
  protomapsPmtilesUrl,
  startMinutes,
  lunchEnabled,
  lunchStartMinutes,
  lunchDurationMinutes,
  onRenameDay,
  onUpdateDayConfig,
  onOptimizeDay,
  isOptimizing,
  onRequestRemoveDay,
  regionName,
  goToPoi,
  onRemoveStop,
  onMoveStopToDay,
  onSetStopDuration,
  maxDay,
  t,
  dict,
  defaultExpanded
}: {
  day: number;
  title: string | null;
  stops: ItineraryStopWithPoi[];
  language: Language;
  route: WalkingRoute | null;
  mapStyleId: SiteSettings["mapStyleId"];
  protomapsPmtilesUrl: string | null;
  startMinutes: number | null;
  lunchEnabled: boolean | null;
  lunchStartMinutes: number | null;
  lunchDurationMinutes: number | null;
  onRenameDay: (title: string) => void;
  onUpdateDayConfig: (patch: DayConfigPatch) => void;
  onOptimizeDay: () => void;
  isOptimizing: boolean;
  onRequestRemoveDay: () => void;
  regionName: (regionId: string) => string;
  goToPoi: (poiId: string) => void;
  onRemoveStop: (stopId: string) => void;
  onMoveStopToDay: (stopId: string, day: number) => void;
  onSetStopDuration: (stopId: string, minutes: number | null) => void;
  maxDay: number;
  t: Translations["auth"];
  dict: Translations;
  defaultExpanded: boolean;
}) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: `day-${day}` });
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title ?? "");
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [startDraft, setStartDraft] = useState("");

  const points = stops.map((stop) => stop.point);
  const summary = computeItinerarySummary(stops);
  const effectiveStart = startMinutes ?? DEFAULT_DAY_START_MINUTES;

  const { entries, endMinutes } = useMemo(() => {
    if (points.length === 0) {
      return { entries: [], endMinutes: effectiveStart };
    }
    const legs = points.slice(0, -1).map((point, i) => {
      const meters =
        route?.legDistancesMeters?.[i] ?? haversineDistanceMeters(stopPointCoordinates(point), stopPointCoordinates(points[i + 1]));
      return { meters, minutes: estimateTransitionMinutes(meters) };
    });
    return buildDayTimeline(points, legs, effectiveStart, {
      durationOverridesMinutes: stops.map((s) => s.durationOverrideMinutes),
      lunch: {
        enabled: lunchEnabled,
        startMinutes: lunchStartMinutes ?? undefined,
        durationMinutes: lunchDurationMinutes ?? undefined
      }
    });
  }, [points, route, effectiveStart, stops, lunchEnabled, lunchStartMinutes, lunchDurationMinutes]);

  const displayTitle = title || t.dayLabel.replace("{n}", String(day));

  function commitStart() {
    setIsEditingStart(false);
    if (!startDraft) return;
    onUpdateDayConfig({ startMinutes: timeInputValueToMinutes(startDraft) });
  }

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "rounded-lg border border-border bg-card/[0.78] p-4 shadow-sm transition",
        isOver && "ring-2 ring-primary/50"
      )}
    >
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
              className="w-full rounded border border-primary/30 bg-card px-1.5 py-0.5 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/25"
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
            {t.dayPlaceCount.replace("{count}", String(points.length))}
            {points.length > 0 && (
              <>
                {" · "}
                {t.dayWalkingDistance.replace("{distance}", formatDistance(summary.walkingDistanceMeters))}
                {" · "}
                {formatDurationLabel(summary.totalMinutes, dict.app.hoursShort, dict.app.minutesShort)}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {points.length > 1 && (
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
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs">
            <span className="font-medium text-muted-foreground">{t.lunchToggleLabel}:</span>
            <select
              value={lunchEnabled ? "on" : "off"}
              onChange={(e) => {
                onUpdateDayConfig({ lunchEnabled: e.target.value === "on" });
              }}
              className="h-6 rounded border border-border bg-card px-1 text-xs outline-none"
            >
              <option value="on">{dict.app.on}</option>
              <option value="off">{dict.app.off}</option>
            </select>
            {lunchEnabled === true && (
              <>
                <span className="text-muted-foreground">{t.lunchStartTime}</span>
                <input
                  type="time"
                  value={minutesToTimeInputValue(lunchStartMinutes ?? LUNCH_THRESHOLD_MINUTES)}
                  onChange={(e) =>
                    onUpdateDayConfig({ lunchStartMinutes: timeInputValueToMinutes(e.target.value) })
                  }
                  className="h-6 rounded border border-border bg-card px-1 text-xs outline-none"
                />
                <span className="text-muted-foreground">{t.lunchDuration}</span>
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={15}
                  value={lunchDurationMinutes ?? LUNCH_DURATION_MINUTES}
                  onChange={(e) => onUpdateDayConfig({ lunchDurationMinutes: Number(e.target.value) })}
                  className="h-6 w-14 rounded border border-border bg-card px-1 text-xs outline-none"
                />
              </>
            )}
          </div>

          {points.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.dayEmptyPlaceholder}</p>
          ) : (
            <>
              <ItineraryDayMap
                stops={points}
                lineCoordinates={route?.lineCoordinates ?? null}
                mapStyleId={mapStyleId}
                protomapsPmtilesUrl={protomapsPmtilesUrl}
              />
              <div className="flex flex-col gap-1.5">
                {isEditingStart ? (
                  <input
                    autoFocus
                    type="time"
                    value={startDraft}
                    onChange={(e) => setStartDraft(e.target.value)}
                    onBlur={commitStart}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitStart();
                      if (e.key === "Escape") setIsEditingStart(false);
                    }}
                    className="w-fit rounded border border-primary/30 bg-card px-1.5 py-0.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/25"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStartDraft(minutesToTimeInputValue(effectiveStart));
                      setIsEditingStart(true);
                    }}
                    className="w-fit text-xs font-medium text-muted-foreground hover:text-primary"
                    title={t.dayStartTime}
                  >
                    {formatMinutesAsTime(effectiveStart)} {t.dayStart}
                  </button>
                )}
                <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {entries.map((entry, index) => {
                    if (entry.type === "stop") {
                      const stop = stops.find((s) => stopPointId(s.point) === stopPointId(entry.point));
                      if (!stop) return null;
                      const stopRegionId = stopPointRegionId(stop.point);
                      return (
                        <ItineraryTimelineRow
                          key={stop.id}
                          stop={stop}
                          language={language}
                          arrivalMinutes={entry.arrivalMinutes}
                          departureMinutes={entry.departureMinutes}
                          durationMinutes={entry.durationMinutes}
                          isDurationOverridden={entry.isDurationOverridden}
                          regionName={stopRegionId ? regionName(stopRegionId) : ""}
                          onSelect={() => {
                            if (stop.point.kind === "poi") goToPoi(stop.point.poi.id);
                          }}
                          onRemove={() => onRemoveStop(stop.id)}
                          onMoveToDay={(targetDay) => onMoveStopToDay(stop.id, targetDay)}
                          onSetDuration={(minutes) => onSetStopDuration(stop.id, minutes)}
                          maxDay={maxDay}
                          t={t}
                          dict={dict}
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
                </SortableContext>
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
  const favorites = useExplorerStore((state) => state.favorites);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
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
  const dict = getTranslations(language);
  const t = dict.auth;
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [pendingClear, setPendingClear] = useState<"saved" | "visited" | "viewed" | "itinerary" | null>(null);
  const [pendingRemoveDay, setPendingRemoveDay] = useState<number | null>(null);
  const [pendingDeleteItinerary, setPendingDeleteItinerary] = useState(false);
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
  const [activeDragStop, setActiveDragStop] = useState<ItineraryStopWithPoi | null>(null);
  const [activeTab, setActiveTab] = useState<AccountTab>("route");
  const [collapsedFavoriteRegionIds, setCollapsedFavoriteRegionIds] = useState<Set<string>>(new Set());

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const itineraryPoiIds = new Set(
    (itinerary?.stops ?? [])
      .map((stop) => (stop.point.kind === "poi" ? stop.point.poi.id : null))
      .filter((id): id is string => id !== null)
  );

  function clampDayCount(raw: string) {
    const parsed = Number(raw);
    if (!raw.trim() || Number.isNaN(parsed)) return 1;
    return Math.min(14, Math.max(1, Math.round(parsed)));
  }

  async function handleAddToItinerary(poiId: string) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleAddAllToItinerary() {
    if (!itinerary) return;
    const poiIds = favoritePois.filter((poi) => !itineraryPoiIds.has(poi.id)).map((poi) => poi.id);
    if (poiIds.length === 0) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleAddRegionToItinerary(regionId: string) {
    if (!itinerary) return;
    const poiIds = favoritePois
      .filter((poi) => poi.regionId === regionId && !itineraryPoiIds.has(poi.id))
      .map((poi) => poi.id);
    if (poiIds.length === 0) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  function toggleFavoriteRegionCollapsed(regionId: string) {
    setCollapsedFavoriteRegionIds((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
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

  async function handleRemoveStopById(stopId: string) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${stopId}`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRemovePoiFromItinerary(poiId: string) {
    if (!itinerary) return;
    const stop = itinerary.stops.find((s) => s.point.kind === "poi" && s.point.poi.id === poiId);
    if (!stop) return;
    await handleRemoveStopById(stop.id);
  }

  async function handleMoveStopToDay(stopId: string, day: number) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${stopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleSetStopDuration(stopId: string, minutes: number | null) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${stopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationOverrideMinutes: minutes })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleReorderItinerary(day: number, orderedStopIds: string[]) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day, orderedStopIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleOptimizeDay(day: number) {
    if (!itinerary) return;
    setOptimizingDay(day);
    try {
      const dayStops = itinerary.stops
        .filter((stop) => stop.day === day)
        .map((stop) => ({ stopId: stop.id, coordinates: stopPointCoordinates(stop.point), importance: stop.point.kind === "poi" ? stop.point.poi.importance : 0 }));
      const ordered = sequenceByNearestNeighbor(dayStops);
      await handleReorderItinerary(day, ordered.map((item) => item.stopId));
    } finally {
      setOptimizingDay(null);
    }
  }

  async function handleAddDay() {
    if (!itinerary) return;
    setIsAddingDay(true);
    try {
      const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/days`, { method: "POST" });
      if (res.ok) setItinerary(await res.json());
    } finally {
      setIsAddingDay(false);
    }
  }

  async function handleRemoveDay(day: number) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/days/${day}`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function updateDayConfig(day: number, patch: DayConfigPatch) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/days/${day}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRenameDay(day: number, title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    await updateDayConfig(day, { title: trimmed });
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
  const [itineraryShareTargetIds, setItineraryShareTargetIds] = useState<Set<string>>(new Set());
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
      .then((body: { users: FriendUser[] }) => setItineraryShareTargetIds(new Set(body.users.map((user) => user.id))));
  }

  async function toggleItineraryShare(friendId: string, isShared: boolean) {
    if (!itinerary) return;
    setPendingItineraryShareId(friendId);
    try {
      if (isShared) {
        await apiFetch(`/api/me/itineraries/${itinerary.id}/shares/${friendId}`, { method: "DELETE" });
        setItineraryShareTargetIds((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        await apiFetch(`/api/me/itineraries/${itinerary.id}/shares`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendUserId: friendId })
        });
        setItineraryShareTargetIds((prev) => new Set(prev).add(friendId));
      }
    } finally {
      setPendingItineraryShareId(null);
    }
  }

  async function handleShareItinerary() {
    if (!itinerary) return;
    const url = `${window.location.origin}/trip/${itinerary.shareToken}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: itinerary.title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
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

  const daySignature = itinerary
    ? itinerary.id +
      "|" +
      itinerary.days
        .map((d) => `${d.day}:${itinerary.stops.filter((s) => s.day === d.day).map((s) => s.id).join(",")}`)
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
          const dayPoints = itinerary.stops.filter((s) => s.day === d.day).map((s) => s.point);
          if (dayPoints.length < 2) return [d.day, null] as const;
          const route = await fetchWalkingRoute(dayPoints.map((point) => stopPointCoordinates(point)));
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

  function handleDragStart(event: DragStartEvent) {
    const stop = itinerary?.stops.find((s) => s.id === event.active.id) ?? null;
    setActiveDragStop(stop);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragStop(null);
    const { active, over } = event;
    if (!over || !itinerary) return;

    const activeStop = itinerary.stops.find((s) => s.id === active.id);
    if (!activeStop) return;

    const overId = String(over.id);
    const overIsDayContainer = overId.startsWith("day-");
    const targetDay = overIsDayContainer
      ? Number(overId.replace("day-", ""))
      : itinerary.stops.find((s) => s.id === over.id)?.day;
    if (targetDay == null) return;

    const targetSiblingStopIds = itinerary.stops
      .filter((s) => s.day === targetDay && s.id !== activeStop.id)
      .sort((a, b) => a.position - b.position)
      .map((s) => s.id);

    const overStop = overIsDayContainer ? null : itinerary.stops.find((s) => s.id === over.id);
    const insertIndex = overStop ? targetSiblingStopIds.indexOf(overStop.id) : targetSiblingStopIds.length;

    const orderedStopIds = [...targetSiblingStopIds];
    orderedStopIds.splice(insertIndex === -1 ? targetSiblingStopIds.length : insertIndex, 0, activeStop.id);

    setItinerary({
      ...itinerary,
      stops: itinerary.stops.map((s) => (s.id === activeStop.id ? { ...s, day: targetDay } : s))
    });

    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${activeStop.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ day: targetDay, orderedStopIds })
    });
    if (res.ok) setItinerary(await res.json());
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

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
  const viewedPois = pois.filter((poi) => viewedPoiIds.includes(poi.id));
  const visitedPois = pois.filter((poi) => visitedPoiIds.includes(poi.id));
  const maxDay = itinerary && itinerary.days.length > 0 ? Math.max(...itinerary.days.map((d) => d.day)) : 0;
  const favoritesByRegion = regions
    .map((region) => ({ regionId: region.id, pois: favoritePois.filter((poi) => poi.regionId === region.id) }))
    .filter((group) => group.pois.length > 0);
  const favoritesTotalMinutes = favoritePois.reduce((sum, poi) => sum + poi.durationMinutes, 0);
  const favoritesTripDays =
    favoritePois.length > 0 ? Math.max(1, Math.ceil(favoritesTotalMinutes / (FAVORITES_TRIP_HOURS_PER_DAY * 60))) : 0;
  const favoritesRegionProgress = favoritesByRegion.map(({ regionId, pois: regionPois }) => {
    const totalInRegion = pois.filter((poi) => poi.regionId === regionId).length;
    const percent = totalInRegion > 0 ? Math.round((regionPois.length / totalInRegion) * 100) : 0;
    return { regionId, count: regionPois.length, percent };
  });

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
                  { id: "history", label: t.tabHistory }
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

          <section className={cn("flex flex-col gap-3", activeTab !== "saved" && "hidden")}>
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
            {favoritePois.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/[0.78] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bookmark className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xl font-bold text-foreground">{favoritePois.length}</div>
                        <div className="text-xs text-muted-foreground">{t.favoritesStatsSaved}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sky-600">
                        <MapIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xl font-bold text-foreground">{favoritesByRegion.length}</div>
                        <div className="text-xs text-muted-foreground">{t.favoritesStatsRegions}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                        <Route className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-xl font-bold text-foreground">
                          {favoritesTripDays}{" "}
                          <span className="text-xs font-normal text-muted-foreground">{t.favoritesStatsDaysUnit}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {t.favoritesStatsDays}
                          <span title={t.favoritesStatsDaysHint.replace("{hoursPerDay}", String(FAVORITES_TRIP_HOURS_PER_DAY))}>
                            <Info className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3 sm:max-w-xs">
                    <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-foreground">{t.favoritesCtaTitle}</div>
                      <div className="text-muted-foreground">
                        {t.favoritesCtaBody.replace("{days}", String(favoritesTripDays))}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {itinerary && itinerary.stops.length > 0 && (
                        <button
                          type="button"
                          onClick={handleShareItinerary}
                          title={isLinkCopied ? t.linkCopied : t.shareItinerary}
                          className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:text-primary"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                      <Button type="button" size="sm" onClick={handleGoToGenerateItinerary}>
                        {t.favoritesCtaButton}
                      </Button>
                    </div>
                  </div>
                </div>

                {favoritesRegionProgress.length > 0 && (
                  <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card/[0.78] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {t.favoritesProgressTitle}
                      </h3>
                      <button
                        type="button"
                        onClick={goToMap}
                        className="flex items-center gap-0.5 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {t.favoritesProgressViewAll}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {favoritesRegionProgress.map(({ regionId, count, percent }) => (
                        <div key={regionId} className="flex items-center gap-3 text-xs">
                          <span className="w-16 shrink-0 truncate font-medium text-foreground">{regionName(regionId)}</span>
                          <span className="w-14 shrink-0 text-muted-foreground">
                            {count} {t.favoritesProgressPlacesUnit}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-right text-muted-foreground">{percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <FavoritesMap
                  pois={favoritePois}
                  mapStyleId={effectiveSiteSettings.mapStyleId}
                  protomapsPmtilesUrl={effectiveSiteSettings.protomapsPmtilesUrl}
                  onSelectPoi={goToPoi}
                  onOpenFullMap={goToMap}
                  openMapLabel={t.favoritesMapOpen}
                />
              </div>
            )}
            {favoritePois.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noSavedPlaces}</p>
            ) : (
              <div className="flex flex-col gap-3">
                {favoritesByRegion.map(({ regionId, pois: regionPois }) => {
                  const isCollapsed = collapsedFavoriteRegionIds.has(regionId);
                  const hasAddable = regionPois.some((poi) => !itineraryPoiIds.has(poi.id));
                  return (
                    <div key={regionId} className="flex flex-col gap-2 rounded-lg border border-border bg-card/[0.62] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavoriteRegionCollapsed(regionId)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-semibold text-foreground"
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">{regionName(regionId)}</span>
                          <span className="shrink-0 text-xs font-normal text-muted-foreground">
                            ({regionPois.length})
                          </span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                              !isCollapsed && "rotate-180"
                            )}
                          />
                        </button>
                        {hasAddable && (
                          <button
                            type="button"
                            onClick={() => handleAddRegionToItinerary(regionId)}
                            title={t.addRegionToItinerary}
                            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:text-primary"
                          >
                            <ListPlus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex flex-col gap-2">
                          {regionPois.map((poi, index) => {
                            const isInItinerary = itineraryPoiIds.has(poi.id);
                            return (
                              <motion.div
                                key={poi.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
                              >
                                <PoiRow
                                  poi={poi}
                                  regionName={regionName(poi.regionId)}
                                  onSelect={() => goToPoi(poi.id)}
                                  action={
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          isInItinerary ? handleRemovePoiFromItinerary(poi.id) : handleAddToItinerary(poi.id)
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
                                      <button
                                        type="button"
                                        onClick={() => toggleFavorite(poi.id)}
                                        title={t.removeFromFavorites}
                                        className="rounded-md p-1.5 text-muted-foreground transition hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  }
                                />
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

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
                    const isShared = itineraryShareTargetIds.has(friend.id);
                    return (
                      <div key={friend.id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <ProfileAvatar avatarId={friend.avatarId} className="h-6 w-6 shrink-0" />
                          <span className="truncate text-xs font-medium text-foreground">
                            {friend.name || `@${friend.username}`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void toggleItineraryShare(friend.id, isShared)}
                          disabled={pendingItineraryShareId === friend.id}
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60",
                            isShared
                              ? "border border-border text-muted-foreground hover:text-foreground"
                              : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                          )}
                        >
                          {isShared ? t.friendsRemove : t.friendsAdd}
                        </button>
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

            {!itinerary || itinerary.days.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.itineraryEmpty}</p>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveDragStop(null)}
              >
                <div className="flex flex-col gap-3">
                  {itinerary.days.map((dayInfo, index) => (
                    <ItineraryDayCard
                      key={dayInfo.day}
                      day={dayInfo.day}
                      title={dayInfo.title}
                      stops={itinerary.stops.filter((stop) => stop.day === dayInfo.day)}
                      route={dayRoutes[dayInfo.day] ?? null}
                      mapStyleId={effectiveSiteSettings.mapStyleId}
                      protomapsPmtilesUrl={effectiveSiteSettings.protomapsPmtilesUrl}
                      startMinutes={dayInfo.startMinutes}
                      lunchEnabled={dayInfo.lunchEnabled}
                      lunchStartMinutes={dayInfo.lunchStartMinutes}
                      lunchDurationMinutes={dayInfo.lunchDurationMinutes}
                      onRenameDay={(title) => handleRenameDay(dayInfo.day, title)}
                      onUpdateDayConfig={(patch) => updateDayConfig(dayInfo.day, patch)}
                      onOptimizeDay={() => handleOptimizeDay(dayInfo.day)}
                      isOptimizing={optimizingDay === dayInfo.day}
                      onRequestRemoveDay={() => setPendingRemoveDay(dayInfo.day)}
                      regionName={regionName}
                      goToPoi={goToPoi}
                      onRemoveStop={handleRemoveStopById}
                      onMoveStopToDay={handleMoveStopToDay}
                      onSetStopDuration={handleSetStopDuration}
                      maxDay={maxDay}
                      t={t}
                      dict={dict}
                      language={language}
                      defaultExpanded={index === 0}
                    />
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddDay} disabled={isAddingDay} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    {t.addDay}
                  </Button>
                </div>
                <DragOverlay>
                  {activeDragStop ? (
                    <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-card p-2.5 shadow-panel">
                      <StopPointThumbnail point={activeDragStop.point} className="h-10 w-10" />
                      <p className="max-w-[10rem] truncate text-sm font-semibold text-foreground">
                        {stopPointName(activeDragStop.point, language, dict.app.markerStopFallbackName)}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </section>

          <section className={cn("flex flex-col gap-3", activeTab !== "history" && "hidden")}>
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
                {visitedPois.map((poi, index) => (
                  <motion.div
                    key={poi.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
                  >
                    <PoiRow poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className={cn("flex flex-col gap-3", activeTab !== "history" && "hidden")}>
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
                {viewedPois.map((poi, index) => (
                  <motion.div
                    key={poi.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
                  >
                    <PoiRow poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
                  </motion.div>
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

      {pendingRemoveDay !== null && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setPendingRemoveDay(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-panel">
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
