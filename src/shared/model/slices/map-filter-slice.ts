import type { StateCreator } from "zustand";
import { defaultRegion, findRegionById } from "@/entities/region/model/regions";
import { kyotoPois } from "@/entities/poi/model/kyoto-pois";
import type { PoiMainCategory } from "@/entities/poi/model/types";
import type { ExplorerState } from "../types";
import { firstPoiIdForRegion, firstPoiIdForRegions } from "../lib/first-poi-id";

export type MapFilterSlice = Pick<
  ExplorerState,
  | "activeRegionIds"
  | "selectedPoiId"
  | "selectedCategories"
  | "searchQuery"
  | "zoom"
  | "isDetailsOpen"
  | "isSwipeOpen"
  | "isMobileSheetExpanded"
  | "isSidebarCollapsed"
  | "selectedSeasons"
  | "selectPoi"
  | "selectPoiFromMap"
  | "setActiveRegion"
  | "setActiveArea"
  | "setActiveCountry"
  | "toggleCategory"
  | "selectAllCategories"
  | "clearAllCategories"
  | "setSearchQuery"
  | "setZoom"
  | "setDetailsOpen"
  | "setIsSwipeOpen"
  | "setIsMobileSheetExpanded"
  | "toggleSidebarCollapsed"
>;

export const createMapFilterSlice: StateCreator<ExplorerState, [], [], MapFilterSlice> = (set) => ({
  activeRegionIds: [defaultRegion.id],
  selectedPoiId: firstPoiIdForRegion(kyotoPois, defaultRegion.id),
  selectedCategories: [],
  searchQuery: "",
  zoom: 11,
  isDetailsOpen: false,
  isSwipeOpen: false,
  isMobileSheetExpanded: false,
  isSidebarCollapsed: false,
  selectedSeasons: [],
  selectPoi: (poiId: string) => set({ selectedPoiId: poiId }),
  selectPoiFromMap: (poiId: string) => set({ selectedPoiId: poiId, isDetailsOpen: true }),
  setActiveRegion: (regionId: string) =>
    set((state) => {
      const region = findRegionById(state.regions, regionId);
      return {
        activeRegionIds: [regionId],
        zoom: region.defaultZoom,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegion(state.pois, regionId)
      };
    }),
  setActiveArea: (areaId: string) =>
    set((state) => {
      const areaRegionIds = state.regions.filter((region) => region.areaId === areaId).map((region) => region.id);
      const activeRegionIds = areaRegionIds.length > 0 ? areaRegionIds : state.activeRegionIds;
      return {
        activeRegionIds,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegions(state.pois, activeRegionIds)
      };
    }),
  setActiveCountry: (countryId: string) =>
    set((state) => {
      const countryAreaIds = state.areas.filter((area) => area.countryId === countryId).map((area) => area.id);
      const countryRegionIds = state.regions
        .filter((region) => countryAreaIds.includes(region.areaId))
        .map((region) => region.id);
      const activeRegionIds = countryRegionIds.length > 0 ? countryRegionIds : state.activeRegionIds;
      return {
        activeRegionIds,
        searchQuery: "",
        selectedPoiId: firstPoiIdForRegions(state.pois, activeRegionIds)
      };
    }),
  toggleCategory: (category: PoiMainCategory) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(category)
        ? state.selectedCategories.filter((c) => c !== category)
        : [...state.selectedCategories, category]
    })),
  selectAllCategories: () => set((state) => ({ selectedCategories: state.categories.map((category) => category.id) })),
  clearAllCategories: () => set({ selectedCategories: [] }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setZoom: (zoom: number) => set({ zoom }),
  setDetailsOpen: (open: boolean) => set({ isDetailsOpen: open }),
  setIsSwipeOpen: (open: boolean) => set({ isSwipeOpen: open }),
  setIsMobileSheetExpanded: (expanded: boolean) => set({ isMobileSheetExpanded: expanded }),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }))
});
