import type { Poi } from "@/entities/poi/model/types";
import { haversineDistanceMeters } from "@/shared/lib/geo";

export type DayTimelineEntry =
  | { type: "stop"; poi: Poi; arrivalMinutes: number; departureMinutes: number }
  | { type: "travel"; minutes: number; meters: number }
  | { type: "lunch"; startMinutes: number; minutes: number };

const LUNCH_DURATION_MINUTES = 60;
const LUNCH_THRESHOLD_MINUTES = 12 * 60;
const MIN_STOPS_FOR_LUNCH = 3;

export function buildDayTimeline(
  stops: Poi[],
  legDurationsMinutes: number[],
  dayStartMinutes = 540
): { entries: DayTimelineEntry[]; endMinutes: number } {
  const entries: DayTimelineEntry[] = [];
  let cursor = dayStartMinutes;
  let lunchInserted = false;
  const shouldInsertLunch = stops.length >= MIN_STOPS_FOR_LUNCH;

  function maybeInsertLunch() {
    if (!shouldInsertLunch || lunchInserted || cursor < LUNCH_THRESHOLD_MINUTES) {
      return;
    }
    entries.push({ type: "lunch", startMinutes: cursor, minutes: LUNCH_DURATION_MINUTES });
    cursor += LUNCH_DURATION_MINUTES;
    lunchInserted = true;
  }

  stops.forEach((poi, index) => {
    const arrivalMinutes = cursor;
    const departureMinutes = arrivalMinutes + poi.durationMinutes;
    entries.push({ type: "stop", poi, arrivalMinutes, departureMinutes });
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
