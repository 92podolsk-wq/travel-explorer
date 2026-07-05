import { create } from "zustand";
import { kyotoPois } from "@/entities/poi/model/kyoto-pois";
import type { Poi } from "@/entities/poi/model/types";
import { defaultExplorationMode } from "@/features/exploration-mode/model/modes";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";
import type { Language } from "@/shared/i18n/types";

type ExplorerState = {
  pois: Poi[];
  selectedPoiId: string;
  activeModeId: ExplorationModeId;
  searchQuery: string;
  favorites: string[];
  language: Language;
  zoom: number;
  isDetailsOpen: boolean;
  selectPoi: (poiId: string) => void;
  selectPoiFromMap: (poiId: string) => void;
  setActiveMode: (modeId: ExplorationModeId) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (language: Language) => void;
  toggleFavorite: (poiId: string) => void;
  setZoom: (zoom: number) => void;
  setDetailsOpen: (open: boolean) => void;
  setPois: (pois: Poi[]) => void;
};

export const useExplorerStore = create<ExplorerState>((set) => ({
  pois: kyotoPois,
  selectedPoiId: kyotoPois[0]?.id ?? "",
  activeModeId: defaultExplorationMode.id,
  searchQuery: "",
  favorites: [],
  language: "en",
  zoom: 11,
  isDetailsOpen: false,
  selectPoi: (poiId) => set({ selectedPoiId: poiId }),
  selectPoiFromMap: (poiId) => set({ selectedPoiId: poiId, isDetailsOpen: true }),
  setActiveMode: (modeId) => set({ activeModeId: modeId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (language) => set({ language }),
  toggleFavorite: (poiId) =>
    set((state) => ({
      favorites: state.favorites.includes(poiId)
        ? state.favorites.filter((id) => id !== poiId)
        : [...state.favorites, poiId]
    })),
  setZoom: (zoom) => set({ zoom }),
  setDetailsOpen: (open) => set({ isDetailsOpen: open }),
  setPois: (pois) =>
    set((state) => ({
      pois,
      selectedPoiId: pois.some((poi) => poi.id === state.selectedPoiId)
        ? state.selectedPoiId
        : (pois[0]?.id ?? "")
    }))
}));
