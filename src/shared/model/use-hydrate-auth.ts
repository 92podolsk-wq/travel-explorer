"use client";

import { useEffect } from "react";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "./explorer-store";

export function useHydrateAuth() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const setCustomMarkers = useExplorerStore((state) => state.setCustomMarkers);
  const setCustomMarkerLimit = useExplorerStore((state) => state.setCustomMarkerLimit);

  useEffect(() => {
    // In the native app-shell, switching between the map and account views
    // remounts whichever one isn't showing (see AppShellRouter) — skip
    // re-fetching everything if this session already hydrated once.
    if (useExplorerStore.getState().authStatus !== "loading") {
      return;
    }

    (async () => {
      const res = await apiFetch("/api/auth/me");
      const data = (await res.json()) as AuthMeResponse;
      hydrateAuth(
        data.user,
        data.user
          ? {
              favoritePoiIds: data.favoritePoiIds ?? [],
              viewedPoiIds: data.viewedPoiIds ?? [],
              visitedPoiIds: data.visitedPoiIds ?? []
            }
          : undefined
      );

      if (!data.user) {
        return;
      }

      const listRes = await apiFetch("/api/me/itineraries");
      if (!listRes.ok) {
        return;
      }

      let list = (await listRes.json()) as ItinerarySummary[];
      if (list.length === 0) {
        const createRes = await apiFetch("/api/me/itineraries", { method: "POST" });
        if (createRes.ok) {
          const created = (await createRes.json()) as Itinerary;
          list = [{ id: created.id, title: created.title }];
          setItinerary(created);
        }
      }
      setItineraries(list);

      const persistedId = useExplorerStore.getState().activeItineraryId;
      const activeId = persistedId && list.some((i) => i.id === persistedId) ? persistedId : (list[0]?.id ?? null);
      setActiveItineraryId(activeId);

      if (activeId && useExplorerStore.getState().itinerary?.id !== activeId) {
        const itineraryRes = await apiFetch(`/api/me/itineraries/${activeId}`);
        if (itineraryRes.ok) {
          setItinerary((await itineraryRes.json()) as Itinerary);
        }
      }

      const markersRes = await apiFetch("/api/me/custom-markers");
      if (markersRes.ok) {
        const markersData = (await markersRes.json()) as { markers: CustomMarker[]; limit: number };
        setCustomMarkers(markersData.markers);
        setCustomMarkerLimit(markersData.limit);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
