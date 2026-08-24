import type { StateCreator } from "zustand";
import { createReferenceDataSlice } from "./slices/reference-data-slice";
import { createPoiStateSlice } from "./slices/poi-state-slice";
import { createAuthSlice } from "./slices/auth-slice";
import { createMapFilterSlice } from "./slices/map-filter-slice";
import { createGeolocationSlice } from "./slices/geolocation-slice";
import { createSettingsSlice } from "./slices/settings-slice";
import { createItinerarySlice } from "./slices/itinerary-slice";
import { createCustomMarkerSlice } from "./slices/custom-marker-slice";
import { createBootstrapStatusSlice } from "./slices/bootstrap-status-slice";
import type { ExplorerState } from "./types";

// Combines every domain slice into the full store shape. Used by
// explorer-store.ts (wrapped in the real app's `persist`+localStorage) and
// directly by tests (wrapped in a plain `create`, no persistence) so slice
// behavior can be exercised without touching localStorage.
export const createExplorerState: StateCreator<ExplorerState, [], [], ExplorerState> = (...args) => ({
  ...createReferenceDataSlice(...args),
  ...createPoiStateSlice(...args),
  ...createAuthSlice(...args),
  ...createMapFilterSlice(...args),
  ...createGeolocationSlice(...args),
  ...createSettingsSlice(...args),
  ...createItinerarySlice(...args),
  ...createCustomMarkerSlice(...args),
  ...createBootstrapStatusSlice(...args)
});
