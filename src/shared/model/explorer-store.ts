import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createExplorerState } from "./create-explorer-state";
import type { ExplorerState } from "./types";

export const useExplorerStore = create<ExplorerState>()(
  persist(createExplorerState, {
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
  })
);
