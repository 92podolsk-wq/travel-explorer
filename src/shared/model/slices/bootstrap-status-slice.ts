import type { StateCreator } from "zustand";
import type { ExplorerState } from "../types";

export type BootstrapStatusSlice = Pick<
  ExplorerState,
  "hasSeenWelcome" | "hasHydrated" | "hasAutoDetectedLanguage" | "setHasSeenWelcome" | "setHasHydrated" | "setHasAutoDetectedLanguage"
>;

export const createBootstrapStatusSlice: StateCreator<ExplorerState, [], [], BootstrapStatusSlice> = (set) => ({
  hasSeenWelcome: false,
  hasHydrated: false,
  hasAutoDetectedLanguage: false,
  setHasSeenWelcome: (value: boolean) => set({ hasSeenWelcome: value }),
  setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
  setHasAutoDetectedLanguage: (value: boolean) => set({ hasAutoDetectedLanguage: value })
});
