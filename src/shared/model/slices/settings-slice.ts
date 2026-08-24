import type { StateCreator } from "zustand";
import type { Language } from "@/shared/i18n/types";
import type { Theme } from "@/shared/lib/theme";
import type { ExplorerState } from "../types";

export type SettingsSlice = Pick<ExplorerState, "language" | "theme" | "setLanguage" | "setTheme">;

export const createSettingsSlice: StateCreator<ExplorerState, [], [], SettingsSlice> = (set) => ({
  language: "ru",
  theme: "system",
  setLanguage: (language: Language) => set({ language }),
  setTheme: (theme: Theme) => set({ theme })
});
