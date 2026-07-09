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
import { seedExplorationModes } from "@/entities/exploration-mode/model/exploration-modes";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { User, UserPoiState } from "@/entities/user/model/types";
import type { Language } from "@/shared/i18n/types";

function firstPoiIdForRegion(pois: Poi[], regionId: string) {
  return pois.find((poi) => poi.regionId === regionId)?.id ?? pois[0]?.id ?? "";
}

function firstPoiIdForRegions(pois: Poi[], regionIds: string[]) {
  return pois.find((poi) => regionIds.includes(poi.regionId))?.id ?? pois[0]?.id ?? "";
}

type ExplorerState = {
  pois: Poi[];
  regions: Region[];
  countries: Country[];
  areas: Area[];
  explorationModes: ExplorationMode[];
  activeRegionIds: string[];
  selectedPoiId: string;
  activeModeId: string;
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
  setActiveArea: (areaId: string) => void;
  setActiveMode: (modeId: string) => void;
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
  setExplorationModes: (explorationModes: ExplorationMode[]) => void;
  toggleSeason: (season: Season) => void;
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
  pois: kyotoPois,
  regions: seedRegions,
  countries: seedCountries,
  areas: seedAreas,
  explorationModes: seedExplorationModes,
  activeRegionIds: [defaultRegion.id],
  selectedPoiId: firstPoiIdForRegion(kyotoPois, defaultRegion.id),
  activeModeId: seedExplorationModes[0]?.id ?? "",
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
        activeRegionIds: [regionId],
        zoom: region.defaultZoom,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegion(state.pois, regionId)
      };
    }),
  setActiveArea: (areaId) =>
    set((state) => {
      const areaRegionIds = state.regions.filter((region) => region.areaId === areaId).map((region) => region.id);
      const activeRegionIds = areaRegionIds.length > 0 ? areaRegionIds : state.activeRegionIds;
      return {
        activeRegionIds,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegions(state.pois, activeRegionIds)
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
        : firstPoiIdForRegions(pois, state.activeRegionIds)
    })),
  setRegions: (regions) =>
    set((state) => {
      const validIds = state.activeRegionIds.filter((id) => regions.some((region) => region.id === id));
      return {
        regions,
        activeRegionIds: validIds.length > 0 ? validIds : regions[0] ? [regions[0].id] : state.activeRegionIds
      };
    }),
  toggleSeason: (season) =>
    set((state) => ({
      selectedSeasons: state.selectedSeasons.includes(season)
        ? state.selectedSeasons.filter((s) => s !== season)
        : [...state.selectedSeasons, season]
    })),
  setCountries: (countries) => set({ countries }),
  setAreas: (areas) => set({ areas }),
  setExplorationModes: (explorationModes) =>
    set((state) => ({
      explorationModes,
      activeModeId: explorationModes.some((mode) => mode.id === state.activeModeId)
        ? state.activeModeId
        : explorationModes[0]?.id ?? state.activeModeId
    }))
    }),
    {
      name: "travel-explorer-settings",
      partialize: (state) => ({ language: state.language })
    }
  )
);
