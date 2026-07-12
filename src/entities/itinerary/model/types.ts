import type { Poi } from "@/entities/poi/model/types";

export type ItineraryStopWithPoi = {
  id: string;
  day: number;
  position: number;
  poi: Poi;
  durationOverrideMinutes: number | null;
};

export type ItineraryDayInfo = {
  day: number;
  title: string | null;
  startMinutes: number | null;
  lunchEnabled: boolean | null;
  lunchStartMinutes: number | null;
  lunchDurationMinutes: number | null;
};

export type Itinerary = {
  id: string;
  title: string;
  shareToken: string;
  stops: ItineraryStopWithPoi[];
  days: ItineraryDayInfo[];
};

export type ItinerarySummary = {
  id: string;
  title: string;
};
