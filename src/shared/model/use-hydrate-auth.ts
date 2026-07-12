"use client";

import { useEffect } from "react";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { useExplorerStore } from "./explorer-store";

export function useHydrateAuth() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
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

      const listRes = await fetch("/api/me/itineraries");
      if (!listRes.ok) {
        return;
      }

      let list = (await listRes.json()) as ItinerarySummary[];
      if (list.length === 0) {
        const createRes = await fetch("/api/me/itineraries", { method: "POST" });
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
        const itineraryRes = await fetch(`/api/me/itineraries/${activeId}`);
        if (itineraryRes.ok) {
          setItinerary((await itineraryRes.json()) as Itinerary);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
