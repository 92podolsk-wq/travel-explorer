import type { StateCreator } from "zustand";
import { seedAreas } from "@/entities/area/model/areas";
import type { Area } from "@/entities/area/model/types";
import { seedCountries } from "@/entities/country/model/countries";
import type { Country } from "@/entities/country/model/types";
import type { Category } from "@/entities/category/model/types";
import { kyotoPois } from "@/entities/poi/model/kyoto-pois";
import type { Poi } from "@/entities/poi/model/types";
import { seedRegions } from "@/entities/region/model/regions";
import type { Region } from "@/entities/region/model/types";
import { seedExplorationModes } from "@/entities/exploration-mode/model/exploration-modes";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import type { ExplorerState } from "../types";
import { firstPoiIdForRegions } from "../lib/first-poi-id";

export type ReferenceDataSlice = Pick<
  ExplorerState,
  | "pois"
  | "regions"
  | "countries"
  | "areas"
  | "explorationModes"
  | "categories"
  | "siteSettings"
  | "setPois"
  | "setRegions"
  | "setCountries"
  | "setAreas"
  | "setExplorationModes"
  | "setCategories"
  | "setSiteSettings"
>;

export const createReferenceDataSlice: StateCreator<ExplorerState, [], [], ReferenceDataSlice> = (set) => ({
  pois: kyotoPois,
  regions: seedRegions,
  countries: seedCountries,
  areas: seedAreas,
  explorationModes: seedExplorationModes,
  categories: [],
  siteSettings: null,
  setPois: (pois: Poi[]) =>
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
  setRegions: (regions: Region[]) =>
    set((state) => {
      const validIds = state.activeRegionIds.filter((id) => regions.some((region) => region.id === id));
      return {
        regions,
        activeRegionIds: validIds.length > 0 ? validIds : regions[0] ? [regions[0].id] : state.activeRegionIds
      };
    }),
  setCountries: (countries: Country[]) => set({ countries }),
  setAreas: (areas: Area[]) => set({ areas }),
  setExplorationModes: (explorationModes: ExplorationMode[]) => set({ explorationModes }),
  setSiteSettings: (siteSettings: SiteSettings) => set({ siteSettings }),
  setCategories: (categories: Category[]) =>
    set((state) => {
      const isInitialLoad = state.categories.length === 0;
      const knownIds = new Set(state.categories.map((category) => category.id));
      const newIds = categories.filter((category) => !knownIds.has(category.id)).map((category) => category.id);
      const validSelected = state.selectedCategories.filter((id) => categories.some((category) => category.id === id));

      return {
        categories,
        selectedCategories: isInitialLoad ? categories.map((category) => category.id) : [...validSelected, ...newIds]
      };
    })
});
