import type { StateCreator } from "zustand";
import { apiFetch } from "@/shared/lib/api-fetch";
import type { ExplorerState } from "../types";

export type PoiStateSlice = Pick<
  ExplorerState,
  | "favorites"
  | "viewedPoiIds"
  | "visitedPoiIds"
  | "toggleFavorite"
  | "toggleVisited"
  | "markPoiViewed"
  | "clearViewedPois"
  | "clearFavoritePois"
  | "clearVisitedPois"
  | "hideViewedOnMap"
  | "hideFavoritesOnMap"
  | "hideVisitedOnMap"
  | "toggleHideViewedOnMap"
  | "toggleHideFavoritesOnMap"
  | "toggleHideVisitedOnMap"
>;

export const createPoiStateSlice: StateCreator<ExplorerState, [], [], PoiStateSlice> = (set, get) => ({
  favorites: [],
  viewedPoiIds: [],
  visitedPoiIds: [],
  hideViewedOnMap: false,
  hideFavoritesOnMap: false,
  hideVisitedOnMap: false,
  toggleFavorite: (poiId: string) => {
    set((state) => ({
      favorites: state.favorites.includes(poiId)
        ? state.favorites.filter((id) => id !== poiId)
        : [...state.favorites, poiId]
    }));
    if (get().currentUser) {
      apiFetch(`/api/me/favorites/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  toggleVisited: (poiId: string) => {
    set((state) => ({
      visitedPoiIds: state.visitedPoiIds.includes(poiId)
        ? state.visitedPoiIds.filter((id) => id !== poiId)
        : [...state.visitedPoiIds, poiId]
    }));
    if (get().currentUser) {
      apiFetch(`/api/me/visited/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  markPoiViewed: (poiId: string) => {
    set((state) =>
      state.viewedPoiIds.includes(poiId) ? state : { viewedPoiIds: [...state.viewedPoiIds, poiId] }
    );
    if (get().currentUser) {
      apiFetch(`/api/me/viewed/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  clearViewedPois: () => {
    set({ viewedPoiIds: [] });
    if (get().currentUser) {
      apiFetch("/api/me/viewed", { method: "DELETE" }).catch(() => {});
    }
  },
  clearFavoritePois: () => {
    set({ favorites: [] });
    if (get().currentUser) {
      apiFetch("/api/me/favorites", { method: "DELETE" }).catch(() => {});
    }
  },
  clearVisitedPois: () => {
    set({ visitedPoiIds: [] });
    if (get().currentUser) {
      apiFetch("/api/me/visited", { method: "DELETE" }).catch(() => {});
    }
  },
  toggleHideViewedOnMap: () => set((state) => ({ hideViewedOnMap: !state.hideViewedOnMap })),
  toggleHideFavoritesOnMap: () => set((state) => ({ hideFavoritesOnMap: !state.hideFavoritesOnMap })),
  toggleHideVisitedOnMap: () => set((state) => ({ hideVisitedOnMap: !state.hideVisitedOnMap }))
});
