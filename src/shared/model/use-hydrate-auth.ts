"use client";

import { useEffect } from "react";
import type { Itinerary } from "@/entities/itinerary/model/types";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { useExplorerStore } from "./explorer-store";

export function useHydrateAuth() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);

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

      if (data.user) {
        const itineraryRes = await fetch("/api/me/itinerary");
        if (itineraryRes.ok) {
          setItinerary((await itineraryRes.json()) as Itinerary);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
