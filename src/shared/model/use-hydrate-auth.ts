"use client";

import { useEffect } from "react";
import type { Itinerary, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { isNativeLocalShell } from "@/shared/lib/native-origins";
import { getDeviceToken } from "@/shared/lib/device-token-storage";
import { useExplorerStore } from "./explorer-store";

// Set synchronously (before any await) so that two instances of this hook
// mounting in the same commit — e.g. the map and account views are both kept
// mounted at once in the native app-shell — can't both start hydrating.
let hydrationStarted = false;

export function useHydrateAuth() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const setItineraries = useExplorerStore((state) => state.setItineraries);
  const setActiveItineraryId = useExplorerStore((state) => state.setActiveItineraryId);
  const setCustomMarkers = useExplorerStore((state) => state.setCustomMarkers);
  const setCustomMarkerLimit = useExplorerStore((state) => state.setCustomMarkerLimit);

  const pushAuthDebugLog = useExplorerStore((state) => state.pushAuthDebugLog);

  useEffect(() => {
    if (hydrationStarted) {
      pushAuthDebugLog("skip: already started");
      return;
    }
    hydrationStarted = true;
    pushAuthDebugLog(`start: onLocalShell=${isNativeLocalShell()}`);

    (async () => {
      try {
        pushAuthDebugLog("calling getDeviceToken()...");
        const token = await getDeviceToken(pushAuthDebugLog);
        pushAuthDebugLog(`token: ${token ? "present" : "none"}`);
        pushAuthDebugLog("fetching /api/auth/me...");
        const res = await apiFetch("/api/auth/me");
        pushAuthDebugLog(`/api/auth/me -> ${res.status}`);
        const data = (await res.json()) as AuthMeResponse;
        pushAuthDebugLog(`parsed json, user=${data.user ? data.user.email : "null"}`);
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
      } catch (error) {
        // Network/CORS failure (e.g. the native app briefly offline) — don't
        // leave authStatus stuck on "loading" forever; fall back to guest so
        // the UI resolves, and allow a future mount to retry.
        pushAuthDebugLog(`ERROR: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`);
        hydrationStarted = false;
        if (useExplorerStore.getState().authStatus === "loading") {
          hydrateAuth(null);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
