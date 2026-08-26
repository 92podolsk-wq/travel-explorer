// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCustomMarkerActions } from "./use-custom-marker-actions";
import { useExplorerStore } from "@/shared/model/explorer-store";

vi.mock("@/shared/lib/api-fetch", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/shared/lib/api-fetch";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

const initialState = useExplorerStore.getState();

describe("useCustomMarkerActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useExplorerStore.setState(initialState, true);
  });

  it("toggling add-marker on/off clears any pending coords", async () => {
    const { result } = renderHook(() => useCustomMarkerActions());

    act(() => result.current.setPendingMarkerCoords({ lat: 1, lng: 2 }));
    await waitFor(() => expect(result.current.pendingMarkerCoords).toEqual({ lat: 1, lng: 2 }));

    act(() => useExplorerStore.setState({ isAddingMarker: true }));
    act(() => result.current.handleToggleAddMarker());

    expect(useExplorerStore.getState().isAddingMarker).toBe(false);
    await waitFor(() => expect(result.current.pendingMarkerCoords).toBeNull());
  });

  it("saves a marker locally (no API call) when there is no signed-in user", async () => {
    useExplorerStore.setState({ currentUser: null });
    const { result } = renderHook(() => useCustomMarkerActions());
    act(() => result.current.setPendingMarkerCoords({ lat: 1, lng: 2 }));
    await waitFor(() => expect(result.current.pendingMarkerCoords).not.toBeNull());

    const outcome = await result.current.handleSaveMarker("#fff", "Spot");

    expect(outcome).toEqual({ ok: true });
    expect(apiFetch).not.toHaveBeenCalled();
    expect(useExplorerStore.getState().customMarkers).toHaveLength(1);
    expect(useExplorerStore.getState().customMarkers[0].id).toMatch(/^local-/);
  });

  it("saves a marker via the API for a signed-in user", async () => {
    useExplorerStore.setState({ currentUser: { id: "u1" } as never });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ id: "server-marker", lat: 1, lng: 2, color: "#fff", label: "Spot" })
    );

    const { result } = renderHook(() => useCustomMarkerActions());
    act(() => result.current.setPendingMarkerCoords({ lat: 1, lng: 2 }));
    await waitFor(() => expect(result.current.pendingMarkerCoords).not.toBeNull());

    const outcome = await result.current.handleSaveMarker("#fff", "Spot");

    expect(outcome).toEqual({ ok: true });
    expect(apiFetch).toHaveBeenCalledWith("/api/me/custom-markers", expect.objectContaining({ method: "POST" }));
    expect(useExplorerStore.getState().customMarkers).toEqual([
      { id: "server-marker", lat: 1, lng: 2, color: "#fff", label: "Spot" }
    ]);
  });

  it("surfaces the marker-limit error message from the server", async () => {
    useExplorerStore.setState({ currentUser: { id: "u1" } as never, customMarkerLimit: 5 });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ error: "MARKER_LIMIT_REACHED", limit: 5 }, false));

    const { result } = renderHook(() => useCustomMarkerActions());
    act(() => result.current.setPendingMarkerCoords({ lat: 1, lng: 2 }));
    await waitFor(() => expect(result.current.pendingMarkerCoords).not.toBeNull());

    const outcome = await result.current.handleSaveMarker("#fff", "Spot");

    expect(outcome.ok).toBe(false);
    expect((outcome as { error: string }).error).toContain("5");
  });

  it("deletes a server marker and calls the API", async () => {
    useExplorerStore.setState({
      currentUser: { id: "u1" } as never,
      customMarkers: [{ id: "server-marker", lat: 1, lng: 2, color: "#fff", label: "Spot" }] as never
    });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));

    const { result } = renderHook(() => useCustomMarkerActions());
    await result.current.handleDeleteMarker("server-marker");

    expect(useExplorerStore.getState().customMarkers).toEqual([]);
    expect(apiFetch).toHaveBeenCalledWith("/api/me/custom-markers/server-marker", { method: "DELETE" });
  });

  it("deletes a local-only marker without calling the API", async () => {
    useExplorerStore.setState({
      currentUser: null,
      customMarkers: [{ id: "local-123", lat: 1, lng: 2, color: "#fff", label: "Spot" }] as never
    });

    const { result } = renderHook(() => useCustomMarkerActions());
    await result.current.handleDeleteMarker("local-123");

    expect(useExplorerStore.getState().customMarkers).toEqual([]);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("adds a marker to the active itinerary", async () => {
    useExplorerStore.setState({
      currentUser: { id: "u1" } as never,
      itinerary: { id: "itin-1", stops: [] } as never
    });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ id: "itin-1", stops: [{ id: "stop-1" }] }));

    const { result } = renderHook(() => useCustomMarkerActions());
    await result.current.handleAddMarkerToItineraryClick("marker-1");

    expect(apiFetch).toHaveBeenCalledWith(
      "/api/me/itineraries/itin-1/stops",
      expect.objectContaining({ method: "POST" })
    );
    expect(useExplorerStore.getState().itinerary).toEqual({ id: "itin-1", stops: [{ id: "stop-1" }] });
  });

  it("removes the itinerary stop matching the marker", async () => {
    useExplorerStore.setState({
      itinerary: {
        id: "itin-1",
        stops: [{ id: "stop-1", point: { kind: "marker", marker: { id: "marker-1" } } }]
      } as never
    });
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ id: "itin-1", stops: [] }));

    const { result } = renderHook(() => useCustomMarkerActions());
    await result.current.handleRemoveMarkerStopClick("marker-1");

    expect(apiFetch).toHaveBeenCalledWith("/api/me/itineraries/itin-1/stops/stop-1", { method: "DELETE" });
  });
});
