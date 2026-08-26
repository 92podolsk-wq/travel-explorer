import { useState } from "react";
import type { CustomMarker } from "@/entities/custom-marker/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";

// Custom-marker CRUD + the itinerary add/remove toggle for markers — split
// out of ExplorerMap since none of it touches the map instance directly
// (it's triggered BY map clicks, but the logic itself is just store/API
// calls). handleLocateMe stays in ExplorerMap since it calls map.flyTo.
export function useCustomMarkerActions() {
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language);
  const customMarkerLimit = useExplorerStore((state) => state.customMarkerLimit);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const isAddingMarker = useExplorerStore((state) => state.isAddingMarker);
  const setIsAddingMarker = useExplorerStore((state) => state.setIsAddingMarker);
  const addCustomMarkerToState = useExplorerStore((state) => state.addCustomMarkerToState);

  const [pendingMarkerCoords, setPendingMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);

  function handleToggleAddMarker() {
    if (isAddingMarker) {
      setIsAddingMarker(false);
      setPendingMarkerCoords(null);
    } else {
      setIsAddingMarker(true);
    }
  }

  async function handleSaveMarker(color: string, label: string): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!pendingMarkerCoords) {
      return { ok: false, error: t.app.markerSaveError };
    }

    if (!currentUser) {
      addCustomMarkerToState({
        id: `local-${Date.now()}`,
        lat: pendingMarkerCoords.lat,
        lng: pendingMarkerCoords.lng,
        color,
        label,
        createdAt: new Date().toISOString()
      });
      setIsAddingMarker(false);
      setPendingMarkerCoords(null);
      return { ok: true };
    }

    const res = await apiFetch("/api/me/custom-markers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat: pendingMarkerCoords.lat, lng: pendingMarkerCoords.lng, color, label })
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string; limit?: number } | null;
      if (data?.error === "MARKER_LIMIT_REACHED") {
        return { ok: false, error: t.app.markerLimitReached.replace("{limit}", String(data.limit ?? customMarkerLimit)) };
      }
      return { ok: false, error: t.app.markerSaveError };
    }

    const marker = (await res.json()) as CustomMarker;
    addCustomMarkerToState(marker);
    setIsAddingMarker(false);
    setPendingMarkerCoords(null);
    return { ok: true };
  }

  async function handleDeleteMarker(id: string) {
    useExplorerStore.getState().removeCustomMarkerFromState(id);
    if (useExplorerStore.getState().currentUser && !id.startsWith("local-")) {
      await apiFetch(`/api/me/custom-markers/${id}`, { method: "DELETE" }).catch(() => {});
    }
  }

  async function handleAddMarkerToItineraryClick(customMarkerId: string) {
    const state = useExplorerStore.getState();
    if (!state.currentUser || !state.itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${state.itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customMarkerId })
    });
    if (res.ok) useExplorerStore.getState().setItinerary(await res.json());
  }

  async function handleRemoveMarkerStopClick(customMarkerId: string) {
    const state = useExplorerStore.getState();
    if (!state.itinerary) return;
    const stop = state.itinerary.stops.find((s) => s.point.kind === "marker" && s.point.marker.id === customMarkerId);
    if (!stop) return;
    const res = await apiFetch(`/api/me/itineraries/${state.itinerary.id}/stops/${stop.id}`, { method: "DELETE" });
    if (res.ok) useExplorerStore.getState().setItinerary(await res.json());
  }

  return {
    pendingMarkerCoords,
    setPendingMarkerCoords,
    handleToggleAddMarker,
    handleSaveMarker,
    handleDeleteMarker,
    handleAddMarkerToItineraryClick,
    handleRemoveMarkerStopClick
  };
}
