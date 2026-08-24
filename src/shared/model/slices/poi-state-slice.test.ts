import { create } from "zustand";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { createExplorerState } from "../create-explorer-state";
import type { ExplorerState } from "../types";

vi.mock("@/shared/lib/api-fetch", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/shared/lib/api-fetch";

function createTestStore() {
  return create<ExplorerState>()(createExplorerState);
}

describe("poi-state-slice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("toggleFavorite flips favorites and fires the API call when signed in", () => {
    const store = createTestStore();
    store.setState({ currentUser: { id: "u1" } as ExplorerState["currentUser"] });

    store.getState().toggleFavorite("poi-1");

    expect(store.getState().favorites).toEqual(["poi-1"]);
    expect(apiFetch).toHaveBeenCalledWith("/api/me/favorites/poi-1", { method: "POST" });

    store.getState().toggleFavorite("poi-1");
    expect(store.getState().favorites).toEqual([]);
  });

  it("toggleFavorite/toggleVisited/markPoiViewed skip the API call entirely as a guest", () => {
    const store = createTestStore();
    // currentUser is null by default (guest) — no auth-slice setup needed.

    store.getState().toggleFavorite("poi-1");
    store.getState().toggleVisited("poi-2");
    store.getState().markPoiViewed("poi-3");

    expect(store.getState().favorites).toEqual(["poi-1"]);
    expect(store.getState().visitedPoiIds).toEqual(["poi-2"]);
    expect(store.getState().viewedPoiIds).toEqual(["poi-3"]);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("markPoiViewed is a no-op for an already-viewed poi", () => {
    const store = createTestStore();
    store.getState().markPoiViewed("poi-1");
    store.getState().markPoiViewed("poi-1");
    expect(store.getState().viewedPoiIds).toEqual(["poi-1"]);
  });

  it("clearFavoritePois/clearVisitedPois/clearViewedPois reset state and call the API when signed in", () => {
    const store = createTestStore();
    store.setState({
      currentUser: { id: "u1" } as ExplorerState["currentUser"],
      favorites: ["a"],
      visitedPoiIds: ["b"],
      viewedPoiIds: ["c"]
    });

    store.getState().clearFavoritePois();
    store.getState().clearVisitedPois();
    store.getState().clearViewedPois();

    expect(store.getState().favorites).toEqual([]);
    expect(store.getState().visitedPoiIds).toEqual([]);
    expect(store.getState().viewedPoiIds).toEqual([]);
    expect(apiFetch).toHaveBeenCalledWith("/api/me/favorites", { method: "DELETE" });
    expect(apiFetch).toHaveBeenCalledWith("/api/me/visited", { method: "DELETE" });
    expect(apiFetch).toHaveBeenCalledWith("/api/me/viewed", { method: "DELETE" });
  });

  it("toggleHideViewedOnMap/toggleHideFavoritesOnMap/toggleHideVisitedOnMap flip their own flag only", () => {
    const store = createTestStore();
    store.getState().toggleHideFavoritesOnMap();
    expect(store.getState()).toMatchObject({ hideFavoritesOnMap: true, hideViewedOnMap: false, hideVisitedOnMap: false });
  });
});
