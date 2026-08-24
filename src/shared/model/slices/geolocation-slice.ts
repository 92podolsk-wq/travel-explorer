import type { StateCreator } from "zustand";
import type { Coordinates } from "@/entities/poi/model/types";
import type { ExplorerState } from "../types";

export type GeolocationSlice = Pick<
  ExplorerState,
  "userLocation" | "isLocatingUser" | "locationError" | "sortByDistance" | "setUserLocation" | "setIsLocatingUser" | "setLocationError" | "setSortByDistance"
>;

export const createGeolocationSlice: StateCreator<ExplorerState, [], [], GeolocationSlice> = (set) => ({
  userLocation: null,
  isLocatingUser: false,
  locationError: null,
  sortByDistance: false,
  setUserLocation: (location: Coordinates | null) => set({ userLocation: location }),
  setIsLocatingUser: (value: boolean) => set({ isLocatingUser: value }),
  setLocationError: (error: string | null) => set({ locationError: error }),
  setSortByDistance: (value: boolean) => set({ sortByDistance: value })
});
