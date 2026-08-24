"use client";

import { useEffect, useMemo, useState } from "react";
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
import { CheckCircle2, ChevronDown, Circle, GripVertical, MapPin, Pencil, Plus, Sparkles, StickyNote, Trash2, X } from "lucide-react";
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
import { stopPointColor, stopPointCoordinates, stopPointId, stopPointName, stopPointRegionId } from "@/entities/itinerary/model/stop-point";
import { PoiThumbnail } from "@/entities/poi/ui/poi-row";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { Language } from "@/shared/i18n/types";
import { getTranslations } from "@/shared/i18n/translations";
import { estimateTransitionMinutes, sequenceByNearestNeighbor } from "@/shared/lib/itinerary-planner";
import { formatDistance, formatSteps, haversineDistanceMeters } from "@/shared/lib/geo";
import { fetchWalkingRoute, type WalkingRoute } from "@/shared/lib/osrm-route";
import { apiFetch } from "@/shared/lib/api-fetch";
import { cn } from "@/shared/lib/cn";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useItineraryStopMutations } from "@/shared/model/use-itinerary-stop-mutations";
import { Button } from "@/shared/ui/button";
import { ItineraryDayMap } from "@/widgets/itinerary-day-map/ui/itinerary-day-map";

type Translations = ReturnType<typeof getTranslations>;

const DEFAULT_DAY_START_MINUTES = 540; // 09:00

type DayConfigPatch = Partial<{
  title: string;
  startMinutes: number | null;
  lunchEnabled: boolean | null;
  lunchStartMinutes: number | null;
  lunchDurationMinutes: number | null;
  notes: string | null;
}>;

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

function ItineraryTimelineRow({
  stop,
  language,
  arrivalMinutes,
  departureMinutes,
  durationMinutes,
  isDurationOverridden,
  regionName,
  isVisited,
  onToggleVisited,
  onSelect,
  onRemove,
  onMoveToDay,
  onSetDuration,
  onSetNotes,
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
  isVisited: boolean;
  onToggleVisited: (() => void) | null;
  onSelect: () => void;
  onRemove: () => void;
  onMoveToDay: (day: number) => void;
  onSetDuration: (minutes: number | null) => void;
  onSetNotes: (notes: string | null) => void;
  maxDay: number;
  t: Translations["auth"];
  dict: Translations;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [departureDraft, setDepartureDraft] = useState(minutesToTimeInputValue(departureMinutes));
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(stop.notes));
  const [notesDraft, setNotesDraft] = useState(stop.notes ?? "");

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
      className="flex flex-col gap-2 rounded-md border border-border bg-card/[0.78] p-2.5 shadow-sm transition hover:bg-muted/60"
    >
    <div className="flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag"
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {onToggleVisited && (
        <button
          type="button"
          onClick={onToggleVisited}
          title={t.markVisited}
          className={cn("shrink-0", isVisited ? "text-primary" : "text-muted-foreground")}
        >
          {isVisited ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
      )}
      <button type="button" onClick={onSelect} className="shrink-0">
        <StopPointThumbnail point={stop.point} className={cn("h-12 w-12", isVisited && "opacity-45")} />
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "block truncate text-left text-sm font-semibold hover:text-primary",
            isVisited ? "text-muted-foreground line-through" : "text-foreground"
          )}
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
          onClick={() => setIsNotesOpen((v) => !v)}
          title={t.notesPlaceholder}
          className={cn("shrink-0 rounded-md p-1.5 transition", stop.notes ? "text-primary" : "text-muted-foreground hover:text-foreground")}
        >
          <StickyNote className="h-4 w-4" />
        </button>
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
      {isNotesOpen && (
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => onSetNotes(notesDraft.trim() ? notesDraft.trim() : null)}
          placeholder={t.notesPlaceholder}
          rows={2}
          className="ml-11 w-[calc(100%-2.75rem)] resize-none rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/25"
        />
      )}
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
  notes,
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
  onSetStopNotes,
  visitedPoiIds,
  onToggleVisited,
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
  notes: string | null;
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
  onSetStopNotes: (stopId: string, notes: string | null) => void;
  visitedPoiIds: Set<string>;
  onToggleVisited: (poiId: string) => void;
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
  const [notesDraft, setNotesDraft] = useState(notes ?? "");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                {" "}({t.stepsApprox.replace("{count}", formatSteps(summary.walkingDistanceMeters))})
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
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => onUpdateDayConfig({ notes: notesDraft.trim() ? notesDraft.trim() : null })}
            placeholder={t.dayNotesPlaceholder}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring/25"
          />
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
                      const stopPoiId = stop.point.kind === "poi" ? stop.point.poi.id : null;
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
                          isVisited={stopPoiId != null && visitedPoiIds.has(stopPoiId)}
                          onToggleVisited={stopPoiId != null ? () => onToggleVisited(stopPoiId) : null}
                          onSelect={() => {
                            if (stop.point.kind === "poi") goToPoi(stop.point.poi.id);
                          }}
                          onRemove={() => onRemoveStop(stop.id)}
                          onMoveToDay={(targetDay) => onMoveStopToDay(stop.id, targetDay)}
                          onSetDuration={(minutes) => onSetStopDuration(stop.id, minutes)}
                          onSetNotes={(notes) => onSetStopNotes(stop.id, notes)}
                          maxDay={maxDay}
                          t={t}
                          dict={dict}
                        />
                      );
                    }

                    if (entry.type === "travel") {
                      return (
                        <p key={`travel-${index}`} className="pl-1 text-xs text-muted-foreground">
                          {entry.minutes} {dict.app.minutesShort} ({formatDistance(entry.meters)},{" "}
                          {t.stepsApprox.replace("{count}", formatSteps(entry.meters))})
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

// The full drag-and-drop day/stop board: day CRUD, stop CRUD (except
// add/remove-from-itinerary, which live in useItineraryStopMutations since
// the saved tab needs them too), reordering, and the remove-day confirm
// dialog. Reads itinerary/language/visitedPoiIds straight from the store
// like the other extracted tabs — only goToPoi (needs navigation/isEmbedded
// logic not derivable from the store) and onAddLocation (opens the
// route-tab shell's add-stop modal) are threaded in as props.
export function ItineraryDaysBoard({
  goToPoi,
  onAddLocation,
  siteSettings
}: {
  goToPoi: (poiId: string) => void;
  onAddLocation: () => void;
  siteSettings: SiteSettings;
}) {
  const language = useExplorerStore((state) => state.language);
  const regions = useExplorerStore((state) => state.regions);
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const toggleVisited = useExplorerStore((state) => state.toggleVisited);
  const { handleRemoveStopById } = useItineraryStopMutations();

  const t = getTranslations(language).auth;
  const dict = getTranslations(language);

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  const maxDay = itinerary && itinerary.days.length > 0 ? Math.max(...itinerary.days.map((d) => d.day)) : 0;

  const [dayRoutes, setDayRoutes] = useState<Record<number, WalkingRoute | null>>({});
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [optimizingDay, setOptimizingDay] = useState<number | null>(null);
  const [activeDragStop, setActiveDragStop] = useState<ItineraryStopWithPoi | null>(null);
  const [pendingRemoveDay, setPendingRemoveDay] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

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

  async function handleSetStopNotes(stopId: string, notes: string | null) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${stopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
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

  return (
    <>
      {!itinerary || itinerary.days.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.itineraryEmpty}</p>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveDragStop(null)}>
          <div className="flex flex-col gap-3">
            {itinerary.days.map((dayInfo, index) => (
              <ItineraryDayCard
                key={dayInfo.day}
                day={dayInfo.day}
                title={dayInfo.title}
                stops={itinerary.stops.filter((stop) => stop.day === dayInfo.day)}
                route={dayRoutes[dayInfo.day] ?? null}
                mapStyleId={siteSettings.mapStyleId}
                protomapsPmtilesUrl={siteSettings.protomapsPmtilesUrl}
                startMinutes={dayInfo.startMinutes}
                lunchEnabled={dayInfo.lunchEnabled}
                lunchStartMinutes={dayInfo.lunchStartMinutes}
                lunchDurationMinutes={dayInfo.lunchDurationMinutes}
                notes={dayInfo.notes}
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
                onSetStopNotes={handleSetStopNotes}
                visitedPoiIds={new Set(visitedPoiIds)}
                onToggleVisited={toggleVisited}
                maxDay={maxDay}
                t={t}
                dict={dict}
                language={language}
                defaultExpanded={index === 0}
              />
            ))}
            <div className="flex gap-2">
              <Button type="button" onClick={onAddLocation} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t.addLocation}
              </Button>
              <Button type="button" variant="outline" onClick={handleAddDay} disabled={isAddingDay} className="gap-1.5">
                <Plus className="h-4 w-4" />
                {t.addDay}
              </Button>
            </div>
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
    </>
  );
}
