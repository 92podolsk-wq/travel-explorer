import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedAreas } from "@/entities/area/model/areas";
import type { Area } from "@/entities/area/model/types";
import { seedCountries } from "@/entities/country/model/countries";
import type { Country } from "@/entities/country/model/types";
import type { Category } from "@/entities/category/model/types";
import { kyotoPois } from "@/entities/poi/model/kyoto-pois";
import type { Coordinates, Poi, PoiMainCategory, Season } from "@/entities/poi/model/types";
import { defaultRegion, findRegionById, seedRegions } from "@/entities/region/model/regions";
import type { Region } from "@/entities/region/model/types";
import { seedExplorationModes } from "@/entities/exploration-mode/model/exploration-modes";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { User, UserPoiState } from "@/entities/user/model/types";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { Language } from "@/shared/i18n/types";
import type { Theme } from "@/shared/lib/theme";
import { apiFetch } from "@/shared/lib/api-fetch";

const DEFAULT_CUSTOM_MARKER_LIMIT = 200;

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
  categories: Category[];
  siteSettings: SiteSettings | null;
  activeRegionIds: string[];
  selectedPoiId: string;
  selectedCategories: PoiMainCategory[];
  searchQuery: string;
  favorites: string[];
  viewedPoiIds: string[];
  visitedPoiIds: string[];
  hideViewedOnMap: boolean;
  hideFavoritesOnMap: boolean;
  hideVisitedOnMap: boolean;
  language: Language;
  theme: Theme;
  zoom: number;
  isDetailsOpen: boolean;
  isSwipeOpen: boolean;
  isMobileSheetExpanded: boolean;
  isSidebarCollapsed: boolean;
  selectedSeasons: Season[];
  userLocation: Coordinates | null;
  isLocatingUser: boolean;
  locationError: string | null;
  sortByDistance: boolean;
  itinerary: Itinerary | null;
  itineraries: ItinerarySummary[];
  activeItineraryId: string | null;
  customMarkers: CustomMarker[];
  customMarkerLimit: number;
  isAddingMarker: boolean;
  currentUser: User | null;
  authStatus: "loading" | "guest" | "authenticated";
  hasSeenWelcome: boolean;
  hasHydrated: boolean;
  hasAutoDetectedLanguage: boolean;
  // TEMP-DIAGNOSTIC: remove once the blank Route/Saved/Profile issue is confirmed fixed.
  authDebugLog: string[];
  pushAuthDebugLog: (entry: string) => void;
  // Lets the embedded Profile screen's guest CTA open the header's login
  // form: the map and account screens are both kept mounted at once in the
  // native app-shell, but AuthMenu (with the login form) lives in the map
  // screen's header, so switching screens alone doesn't open it.
  authFormOpenRequested: boolean;
  requestAuthFormOpen: () => void;
  clearAuthFormOpenRequest: () => void;
  hydrateAuth: (user: User | null, poiState?: UserPoiState) => void;
  selectPoi: (poiId: string) => void;
  selectPoiFromMap: (poiId: string) => void;
  setActiveRegion: (regionId: string) => void;
  setActiveArea: (areaId: string) => void;
  toggleCategory: (category: PoiMainCategory) => void;
  selectAllCategories: () => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
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
  setIsSwipeOpen: (open: boolean) => void;
  setIsMobileSheetExpanded: (expanded: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setPois: (pois: Poi[]) => void;
  setRegions: (regions: Region[]) => void;
  setCountries: (countries: Country[]) => void;
  setAreas: (areas: Area[]) => void;
  setExplorationModes: (explorationModes: ExplorationMode[]) => void;
  setCategories: (categories: Category[]) => void;
  setSiteSettings: (siteSettings: SiteSettings) => void;
  setUserLocation: (location: Coordinates | null) => void;
  setIsLocatingUser: (value: boolean) => void;
  setLocationError: (error: string | null) => void;
  setSortByDistance: (value: boolean) => void;
  setItinerary: (itinerary: Itinerary | null) => void;
  setItineraries: (list: ItinerarySummary[]) => void;
  setActiveItineraryId: (id: string | null) => void;
  setCustomMarkers: (markers: CustomMarker[]) => void;
  addCustomMarkerToState: (marker: CustomMarker) => void;
  removeCustomMarkerFromState: (id: string) => void;
  setCustomMarkerLimit: (limit: number) => void;
  setIsAddingMarker: (value: boolean) => void;
  setHasSeenWelcome: (value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  setHasAutoDetectedLanguage: (value: boolean) => void;
};

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
  pois: kyotoPois,
  regions: seedRegions,
  countries: seedCountries,
  areas: seedAreas,
  explorationModes: seedExplorationModes,
  categories: [],
  siteSettings: null,
  activeRegionIds: [defaultRegion.id],
  selectedPoiId: firstPoiIdForRegion(kyotoPois, defaultRegion.id),
  selectedCategories: [],
  searchQuery: "",
  favorites: [],
  viewedPoiIds: [],
  visitedPoiIds: [],
  hideViewedOnMap: false,
  hideFavoritesOnMap: false,
  hideVisitedOnMap: false,
  language: "ru",
  theme: "system",
  zoom: 11,
  isDetailsOpen: false,
  isSwipeOpen: false,
  isMobileSheetExpanded: false,
  isSidebarCollapsed: false,
  selectedSeasons: [],
  userLocation: null,
  isLocatingUser: false,
  locationError: null,
  sortByDistance: false,
  itinerary: null,
  itineraries: [],
  activeItineraryId: null,
  customMarkers: [],
  customMarkerLimit: DEFAULT_CUSTOM_MARKER_LIMIT,
  isAddingMarker: false,
  currentUser: null,
  authStatus: "loading",
  hasSeenWelcome: false,
  hasHydrated: false,
  hasAutoDetectedLanguage: false,
  authDebugLog: [],
  pushAuthDebugLog: (entry) =>
    set((state) => ({ authDebugLog: [...state.authDebugLog, `${new Date().toISOString().slice(11, 19)} ${entry}`] })),
  authFormOpenRequested: false,
  requestAuthFormOpen: () => set({ authFormOpenRequested: true }),
  clearAuthFormOpenRequest: () => set({ authFormOpenRequested: false }),
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
  toggleCategory: (category) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category]
    })),
  selectAllCategories: () => set((state) => ({ selectedCategories: state.categories.map((category) => category.id) })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (language) => set({ language }),
  setTheme: (theme) => set({ theme }),
  toggleFavorite: (poiId) => {
    set((state) => ({
      favorites: state.favorites.includes(poiId)
        ? state.favorites.filter((id) => id !== poiId)
        : [...state.favorites, poiId]
    }));
    if (get().currentUser) {
      apiFetch(`/api/me/favorites/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  toggleVisited: (poiId) => {
    set((state) => ({
      visitedPoiIds: state.visitedPoiIds.includes(poiId)
        ? state.visitedPoiIds.filter((id) => id !== poiId)
        : [...state.visitedPoiIds, poiId]
    }));
    if (get().currentUser) {
      apiFetch(`/api/me/visited/${poiId}`, { method: "POST" }).catch(() => {});
    }
  },
  markPoiViewed: (poiId) => {
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
  toggleHideVisitedOnMap: () => set((state) => ({ hideVisitedOnMap: !state.hideVisitedOnMap })),
  setZoom: (zoom) => set({ zoom }),
  setDetailsOpen: (open) => set({ isDetailsOpen: open }),
  setIsSwipeOpen: (open) => set({ isSwipeOpen: open }),
  setIsMobileSheetExpanded: (expanded) => set({ isMobileSheetExpanded: expanded }),
  setPois: (pois) =>
    set((state) => {
      const currentPoi = pois.find((poi) => poi.id === state.selectedPoiId);
      return {
        pois,
        selectedPoiId:
          currentPoi && state.activeRegionIds.includes(currentPoi.regionId)
            ? state.selectedPoiId
            : firstPoiIdForRegions(pois, state.activeRegionIds)
      };
    }),
  setRegions: (regions) =>
    set((state) => {
      const validIds = state.activeRegionIds.filter((id) => regions.some((region) => region.id === id));
      return {
        regions,
        activeRegionIds: validIds.length > 0 ? validIds : regions[0] ? [regions[0].id] : state.activeRegionIds
      };
    }),
  setCountries: (countries) => set({ countries }),
  setAreas: (areas) => set({ areas }),
  setExplorationModes: (explorationModes) => set({ explorationModes }),
  setSiteSettings: (siteSettings) => set({ siteSettings }),
  setCategories: (categories) =>
    set((state) => {
      const isInitialLoad = state.categories.length === 0;
      const knownIds = new Set(state.categories.map((category) => category.id));
      const newIds = categories.filter((category) => !knownIds.has(category.id)).map((category) => category.id);
      const validSelected = state.selectedCategories.filter((id) => categories.some((category) => category.id === id));

      return {
        categories,
        selectedCategories: isInitialLoad ? categories.map((category) => category.id) : [...validSelected, ...newIds]
      };
    }),
  setUserLocation: (location) => set({ userLocation: location }),
  setIsLocatingUser: (value) => set({ isLocatingUser: value }),
  setLocationError: (error) => set({ locationError: error }),
  setSortByDistance: (value) => set({ sortByDistance: value }),
  setItinerary: (itinerary) => set({ itinerary }),
  setItineraries: (list) => set({ itineraries: list }),
  setActiveItineraryId: (id) => set({ activeItineraryId: id }),
  setCustomMarkers: (markers) => set({ customMarkers: markers }),
  addCustomMarkerToState: (marker) => set((state) => ({ customMarkers: [...state.customMarkers, marker] })),
  removeCustomMarkerFromState: (id) =>
    set((state) => ({ customMarkers: state.customMarkers.filter((marker) => marker.id !== id) })),
  setCustomMarkerLimit: (limit) => set({ customMarkerLimit: limit }),
  setIsAddingMarker: (value) => set({ isAddingMarker: value }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
  setHasHydrated: (value) => set({ hasHydrated: value }),
  setHasAutoDetectedLanguage: (value) => set({ hasAutoDetectedLanguage: value })
    }),
    {
      name: "travel-explorer-settings",
      partialize: (state) => ({
        language: state.language,
        theme: state.theme,
        activeRegionIds: state.activeRegionIds,
        activeItineraryId: state.activeItineraryId,
        isSidebarCollapsed: state.isSidebarCollapsed,
        hasSeenWelcome: state.hasSeenWelcome,
        hasAutoDetectedLanguage: state.hasAutoDetectedLanguage
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
