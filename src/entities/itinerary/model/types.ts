import type { Poi } from "@/entities/poi/model/types";

export type ItineraryStopWithPoi = {
  id: string;
  day: number;
  position: number;
  poi: Poi;
};

export type ItineraryDayInfo = {
  day: number;
  title: string | null;
};

export type Itinerary = {
  id: string;
  title: string;
  shareToken: string;
  stops: ItineraryStopWithPoi[];
  days: ItineraryDayInfo[];
};
