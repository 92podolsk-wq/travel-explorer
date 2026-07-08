import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedAreas } from "@/entities/area/model/areas";
import type { Area } from "@/entities/area/model/types";
import { seedCountries } from "@/entities/country/model/countries";
import type { Country } from "@/entities/country/model/types";
import { kyotoPois } from "@/entities/poi/model/kyoto-pois";
import type { Poi, Season } from "@/entities/poi/model/types";
import { defaultRegion, findRegionById, seedRegions } from "@/entities/region/model/regions";
import type { Region } from "@/entities/region/model/types";
import { defaultExplorationMode } from "@/features/exploration-mode/model/modes";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";
import type { User, UserPoiState } from "@/entities/user/model/types";
import type { Language } from "@/shared/i18n/types";

function firstPoiIdForRegion(pois: Poi[], regionId: string) {
  return pois.find((poi) => poi.regionId === regionId)?.id ?? pois[0]?.id ?? "";
}

type ExplorerState = {
  pois: Poi[];
  regions: Region[];
  countries: Country[];
  areas: Area[];
  activeRegionId: string;
  selectedPoiId: string;
  activeModeId: ExplorationModeId;
  searchQuery: string;
  favorites: string[];
  viewedPoiIds: string[];
  visitedPoiIds: string[];
  hideViewedOnMap: boolean;
  hideFavoritesOnMap: boolean;
  hideVisitedOnMap: boolean;
  language: Language;
  zoom: number;
  isDetailsOpen: boolean;
  selectedSeasons: Season[];
  currentUser: User | null;
  authStatus: "loading" | "guest" | "authenticated";
  hydrateAuth: (user: User | null, poiState?: UserPoiState) => void;
  selectPoi: (poiId: string) => void;
  selectPoiFromMap: (poiId: string) => void;
  setActiveRegion: (regionId: string) => void;
  setActiveMode: (modeId: ExplorationModeId) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (language: Language) => void;
  toggleFavorite: (poiId: string) => void;
  toggleVisited: (poiId: string) => void;
  markPoiViewed: (poiId: string) => void;
  clearViewedPois: () => void;
  clearFavoritePois: () => void;
  clearVisitedPois: () => void;
  toggleHideViewedOnMap: () => void;
  toggleHideFavoritesOnMap: () => void;
  toggleHideVisitedOnMap: () => void;
  setZoom: (zoom: number) => void;
  setDetailsOpen: (open: boolean) => void;
  setPois: (pois: Poi[]) => void;
  setRegions: (regions: Region[]) => void;
  setCountries: (countries: Country[]) => void;
  setAreas: (areas: Area[]) => void;
  toggleSeason: (season: Season) => void;
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
  pois: kyotoPois,
  regions: seedRegions,
  countries: seedCountries,
  areas: seedAreas,
  activeRegionId: defaultRegion.id,
  selectedPoiId: firstPoiIdForRegion(kyotoPois, defaultRegion.id),
  activeModeId: defaultExplorationMode.id,
  searchQuery: "",
  favorites: [],
  viewedPoiIds: [],
  visitedPoiIds: [],
  hideViewedOnMap: false,
  hideFavoritesOnMap: false,
  hideVisitedOnMap: false,
  language: "en",
  zoom: 11,
  isDetailsOpen: false,
  selectedSeasons: [],
  currentUser: null,
  authStatus: "loading",
  hydrateAuth: (user, poiState) =>
    set({
      currentUser: user,
      authStatus: user ? "authenticated" : "guest",
      ...(user && poiState
        ? {
            favorites: poiState.favoritePoiIds,
            viewedPoiIds: poiState.viewedPoiIds,
            visitedPoiIds: poiState.visitedPoiIds
          }
        : {})
    }),
  selectPoi: (poiId) => set({ selectedPoiId: poiId }),
  selectPoiFromMap: (poiId) => set({ selectedPoiId: poiId, isDetailsOpen: true }),
  setActiveRegion: (regionId) =>
    set((state) => {
      const region = findRegionById(state.regions, regionId);
      return {
        activeRegionId: regionId,
        zoom: region.defaultZoom,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegion(state.pois, regionId)
      };
    }),
  setActiveMode: (modeId) => set({ activeModeId: modeId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (language) => set({ language }),
  toggleFavorite: (poiId) => {
    set((state) => ({
      favorites: state.favorites.includes(poiId)
        ? state.favorites.filter((id) => id !== poiId)
        : [...state.favorites, poiId]
    }));
    if (get().currentUser) {
      fetch(`/api/me/favorites/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  toggleVisited: (poiId) => {
    set((state) => ({
      visitedPoiIds: state.visitedPoiIds.includes(poiId)
        ? state.visitedPoiIds.filter((id) => id !== poiId)
        : [...state.visitedPoiIds, poiId]
    }));
    if (get().currentUser) {
      fetch(`/api/me/visited/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  markPoiViewed: (poiId) => {
    set((state) =>
      state.viewedPoiIds.includes(poiId) ? state : { viewedPoiIds: [...state.viewedPoiIds, poiId] }
    );
    if (get().currentUser) {
      fetch(`/api/me/viewed/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  clearViewedPois: () => {
    set({ viewedPoiIds: [] });
    if (get().currentUser) {
      fetch("/api/me/viewed", { method: "DELETE" }).catch(() => {});
    }
  },
  clearFavoritePois: () => {
    set({ favorites: [] });
    if (get().currentUser) {
      fetch("/api/me/favorites", { method: "DELETE" }).catch(() => {});
    }
  },
  clearVisitedPois: () => {
    set({ visitedPoiIds: [] });
    if (get().currentUser) {
      fetch("/api/me/visited", { method: "DELETE" }).catch(() => {});
    }
  },
  toggleHideViewedOnMap: () => set((state) => ({ hideViewedOnMap: !state.hideViewedOnMap })),
  toggleHideFavoritesOnMap: () => set((state) => ({ hideFavoritesOnMap: !state.hideFavoritesOnMap })),
  toggleHideVisitedOnMap: () => set((state) => ({ hideVisitedOnMap: !state.hideVisitedOnMap })),
  setZoom: (zoom) => set({ zoom }),
  setDetailsOpen: (open) => set({ isDetailsOpen: open }),
  setPois: (pois) =>
    set((state) => ({
      pois,
      selectedPoiId: pois.some((poi) => poi.id === state.selectedPoiId)
        ? state.selectedPoiId
        : firstPoiIdForRegion(pois, state.activeRegionId)
    })),
  setRegions: (regions) =>
    set((state) => ({
      regions,
      activeRegionId: regions.some((region) => region.id === state.activeRegionId)
        ? state.activeRegionId
        : (regions[0]?.id ?? state.activeRegionId)
    })),
  toggleSeason: (season) =>
    set((state) => ({
      selectedSeasons: state.selectedSeasons.includes(season)
        ? state.selectedSeasons.filter((s) => s !== season)
        : [...state.selectedSeasons, season]
    })),
  setCountries: (countries) => set({ countries }),
  setAreas: (areas) => set({ areas })
    }),
    {
      name: "travel-explorer-settings",
      partialize: (state) => ({ language: state.language })
    }
  )
);
