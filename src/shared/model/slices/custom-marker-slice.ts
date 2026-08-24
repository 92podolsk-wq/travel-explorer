import type { StateCreator } from "zustand";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { ExplorerState } from "../types";

const DEFAULT_CUSTOM_MARKER_LIMIT = 200;

export type CustomMarkerSlice = Pick<
  ExplorerState,
  | "customMarkers"
  | "customMarkerLimit"
  | "isAddingMarker"
  | "setCustomMarkers"
  | "addCustomMarkerToState"
  | "removeCustomMarkerFromState"
  | "setCustomMarkerLimit"
  | "setIsAddingMarker"
>;

export const createCustomMarkerSlice: StateCreator<ExplorerState, [], [], CustomMarkerSlice> = (set) => ({
  customMarkers: [],
  customMarkerLimit: DEFAULT_CUSTOM_MARKER_LIMIT,
  isAddingMarker: false,
  setCustomMarkers: (markers: CustomMarker[]) => set({ customMarkers: markers }),
  addCustomMarkerToState: (marker: CustomMarker) => set((state) => ({ customMarkers: [...state.customMarkers, marker] })),
  removeCustomMarkerFromState: (id: string) =>
    set((state) => ({ customMarkers: state.customMarkers.filter((marker) => marker.id !== id) })),
  setCustomMarkerLimit: (limit: number) => set({ customMarkerLimit: limit }),
  setIsAddingMarker: (value: boolean) => set({ isAddingMarker: value })
});
