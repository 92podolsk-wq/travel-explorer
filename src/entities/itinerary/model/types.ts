import type { Poi } from "@/entities/poi/model/types";

export type ItineraryStopWithPoi = {
  id: string;
  position: number;
  poi: Poi;
};

export type Itinerary = {
  id: string;
  title: string;
  shareToken: string;
  stops: ItineraryStopWithPoi[];
};
