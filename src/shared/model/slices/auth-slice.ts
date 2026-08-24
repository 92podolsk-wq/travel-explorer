import type { StateCreator } from "zustand";
import type { User, UserPoiState } from "@/entities/user/model/types";
import type { ExplorerState } from "../types";

export type AuthSlice = Pick<
  ExplorerState,
  | "currentUser"
  | "authStatus"
  | "hydrateAuth"
  | "authDebugLog"
  | "pushAuthDebugLog"
  | "authFormOpenRequested"
  | "requestAuthFormOpen"
  | "clearAuthFormOpenRequest"
>;

export const createAuthSlice: StateCreator<ExplorerState, [], [], AuthSlice> = (set) => ({
  currentUser: null,
  authStatus: "loading",
  // TEMP-DIAGNOSTIC: remove once the blank Route/Saved/Profile issue is confirmed fixed.
  authDebugLog: [],
  pushAuthDebugLog: (entry: string) =>
    set((state) => ({ authDebugLog: [...state.authDebugLog, `${new Date().toISOString().slice(11, 19)} ${entry}`] })),
  authFormOpenRequested: false,
  requestAuthFormOpen: () => set({ authFormOpenRequested: true }),
  clearAuthFormOpenRequest: () => set({ authFormOpenRequested: false }),
  hydrateAuth: (user: User | null, poiState?: UserPoiState) =>
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
    })
});
