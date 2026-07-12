import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";

export type DayTimelineEntry =
  | {
      type: "stop";
      poi: Poi;
      arrivalMinutes: number;
      departureMinutes: number;
      durationMinutes: number;
      isDurationOverridden: boolean;
    }
  | { type: "travel"; minutes: number; meters: number }
  | { type: "lunch"; startMinutes: number; minutes: number };

export const LUNCH_DURATION_MINUTES = 60;
export const LUNCH_THRESHOLD_MINUTES = 12 * 60;
const MIN_STOPS_FOR_LUNCH = 3;

export type LunchOptions = { enabled: boolean | null; startMinutes?: number; durationMinutes?: number };

export function buildDayTimeline(
  stops: Poi[],
  legDurationsMinutes: number[],
  dayStartMinutes = 540,
  options?: { durationOverridesMinutes?: (number | null)[]; lunch?: LunchOptions }
): { entries: DayTimelineEntry[]; endMinutes: number } {
  const entries: DayTimelineEntry[] = [];
  let cursor = dayStartMinutes;
  let lunchInserted = false;

  const lunch = options?.lunch;
  const heuristicLunch = lunch === undefined || lunch.enabled === null || lunch.enabled === undefined;
  const shouldInsertLunch = heuristicLunch ? stops.length >= MIN_STOPS_FOR_LUNCH : lunch!.enabled === true;
  const lunchThresholdMinutes = (!heuristicLunch && lunch?.startMinutes != null) ? lunch.startMinutes : LUNCH_THRESHOLD_MINUTES;
  const lunchDurationMinutes = (!heuristicLunch && lunch?.durationMinutes != null) ? lunch.durationMinutes : LUNCH_DURATION_MINUTES;

  function maybeInsertLunch() {
    if (!shouldInsertLunch || lunchInserted || cursor < lunchThresholdMinutes) {
      return;
    }
    entries.push({ type: "lunch", startMinutes: cursor, minutes: lunchDurationMinutes });
    cursor += lunchDurationMinutes;
    lunchInserted = true;
  }

  stops.forEach((poi, index) => {
    const overrideMinutes = options?.durationOverridesMinutes?.[index] ?? null;
    const durationMinutes = overrideMinutes ?? poi.durationMinutes;
    const arrivalMinutes = cursor;
    const departureMinutes = arrivalMinutes + durationMinutes;
    entries.push({
      type: "stop",
      poi,
      arrivalMinutes,
      departureMinutes,
      durationMinutes,
      isDurationOverridden: overrideMinutes != null
    });
    cursor = departureMinutes;
    maybeInsertLunch();

    if (index < stops.length - 1) {
      const meters = haversineDistanceMeters(poi.coordinates, stops[index + 1].coordinates);
      const minutes = Math.round(legDurationsMinutes[index] ?? 0);
      entries.push({ type: "travel", minutes, meters });
      cursor += minutes;
      maybeInsertLunch();
    }
  });

  return { entries, endMinutes: cursor };
}

export function formatMinutesAsTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const mins = wrapped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function minutesToTimeInputValue(minutes: number): string {
  return formatMinutesAsTime(minutes);
}

export function timeInputValueToMinutes(value: string): number {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
}
