import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Coordinates, Poi, PoiMainCategory, Season } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { User, UserPoiState } from "@/entities/user/model/types";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { Language } from "@/shared/i18n/types";
import type { Theme } from "@/shared/lib/theme";

// Ported/split across src/shared/model/slices/* (one file per domain) and
// combined in explorer-store.ts via the Zustand slices pattern — this type
// is the single source of truth for the combined shape all slices are typed
// against, so every slice can read/write fields owned by another slice
// (e.g. hydrateAuth touching poi-state fields) without circular imports.
export type ExplorerState = {
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
  setActiveCountry: (countryId: string) => void;
  toggleCategory: (category: PoiMainCategory) => void;
  selectAllCategories: () => void;
  clearAllCategories: () => void;
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
