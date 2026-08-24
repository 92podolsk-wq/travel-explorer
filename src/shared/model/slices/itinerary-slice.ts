import type { StateCreator } from "zustand";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { ExplorerState } from "../types";

export type ItinerarySlice = Pick<
  ExplorerState,
  "itinerary" | "itineraries" | "activeItineraryId" | "setItinerary" | "setItineraries" | "setActiveItineraryId"
>;

export const createItinerarySlice: StateCreator<ExplorerState, [], [], ItinerarySlice> = (set) => ({
  itinerary: null,
  itineraries: [],
  activeItineraryId: null,
  setItinerary: (itinerary: Itinerary | null) => set({ itinerary }),
  setItineraries: (list: ItinerarySummary[]) => set({ itineraries: list }),
  setActiveItineraryId: (id: string | null) => set({ activeItineraryId: id })
});
