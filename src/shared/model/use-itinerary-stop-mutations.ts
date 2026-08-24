"use client";

import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "./explorer-store";

// Shared by the saved (favorites) tab's add/remove-from-itinerary buttons
// and the route tab's "add stop" modal — both surfaces mutate the same
// active itinerary, so this hook reads it straight from the store rather
// than being threaded through as props from a parent.
export function useItineraryStopMutations() {
  const itinerary = useExplorerStore((state) => state.itinerary);
  const setItinerary = useExplorerStore((state) => state.setItinerary);
  const favorites = useExplorerStore((state) => state.favorites);
  const pois = useExplorerStore((state) => state.pois);

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));

  const itineraryPoiIds = new Set(
    (itinerary?.stops ?? [])
      .map((stop) => (stop.point.kind === "poi" ? stop.point.poi.id : null))
      .filter((id): id is string => id !== null)
  );

  async function handleAddToItinerary(poiId: string) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleAddAllToItinerary() {
    if (!itinerary) return;
    const poiIds = favoritePois.filter((poi) => !itineraryPoiIds.has(poi.id)).map((poi) => poi.id);
    if (poiIds.length === 0) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleAddRegionToItinerary(regionId: string) {
    if (!itinerary) return;
    const poiIds = favoritePois
      .filter((poi) => poi.regionId === regionId && !itineraryPoiIds.has(poi.id))
      .map((poi) => poi.id);
    if (poiIds.length === 0) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiIds })
    });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRemoveStopById(stopId: string) {
    if (!itinerary) return;
    const res = await apiFetch(`/api/me/itineraries/${itinerary.id}/stops/${stopId}`, { method: "DELETE" });
    if (res.ok) setItinerary(await res.json());
  }

  async function handleRemovePoiFromItinerary(poiId: string) {
    if (!itinerary) return;
    const stop = itinerary.stops.find((s) => s.point.kind === "poi" && s.point.poi.id === poiId);
    if (!stop) return;
    await handleRemoveStopById(stop.id);
  }

  return {
    itineraryPoiIds,
    handleAddToItinerary,
    handleAddAllToItinerary,
    handleAddRegionToItinerary,
    handleRemoveStopById,
    handleRemovePoiFromItinerary
  };
}
