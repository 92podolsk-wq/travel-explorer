// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useItineraryRealtime } from "./useItineraryRealtime";

vi.mock("@/shared/lib/api-fetch", () => ({ apiFetch: vi.fn() }));

import { apiFetch } from "@/shared/lib/api-fetch";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
}

describe("useItineraryRealtime", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.clearAllMocks();
    (global as unknown as { WebSocket: unknown }).WebSocket = FakeWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connects to /realtime and subscribes to the itinerary on open", () => {
    const onUpdate = vi.fn();
    renderHook(() => useItineraryRealtime("itin-1", onUpdate));

    expect(FakeWebSocket.instances).toHaveLength(1);
    const socket = FakeWebSocket.instances[0];
    expect(socket.url).toMatch(/^ws:\/\/.*\/realtime$/);

    act(() => socket.onopen?.());
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ type: "subscribe", itineraryId: "itin-1" }));
  });

  it("refetches and calls onUpdate when an itinerary:updated message arrives for this itinerary", async () => {
    const onUpdate = vi.fn();
    const updatedItinerary = { id: "itin-1", title: "Updated" };
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(updatedItinerary)
    });
    renderHook(() => useItineraryRealtime("itin-1", onUpdate));
    const socket = FakeWebSocket.instances[0];

    act(() => socket.onmessage?.({ data: JSON.stringify({ type: "itinerary:updated", itineraryId: "itin-1" }) }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(updatedItinerary));
    expect(apiFetch).toHaveBeenCalledWith("/api/me/itineraries/itin-1");
  });

  it("ignores itinerary:updated messages for a different itinerary", () => {
    const onUpdate = vi.fn();
    renderHook(() => useItineraryRealtime("itin-1", onUpdate));
    const socket = FakeWebSocket.instances[0];

    act(() => socket.onmessage?.({ data: JSON.stringify({ type: "itinerary:updated", itineraryId: "some-other" }) }));

    expect(apiFetch).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("ignores malformed message frames instead of throwing", () => {
    renderHook(() => useItineraryRealtime("itin-1", vi.fn()));
    const socket = FakeWebSocket.instances[0];

    expect(() => act(() => socket.onmessage?.({ data: "not json" }))).not.toThrow();
  });

  it("tracks presence users from presence messages and clears them on close", () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useItineraryRealtime("itin-1", onUpdate));
    const socket = FakeWebSocket.instances[0];

    const users = [{ id: "u1", name: "Alex", username: "alex", avatarId: null }];
    act(() => socket.onmessage?.({ data: JSON.stringify({ type: "presence", itineraryId: "itin-1", users }) }));
    expect(result.current).toEqual(users);

    act(() => socket.onclose?.());
    expect(result.current).toEqual([]);
  });

  it("reconnects 3s after the socket closes", () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    renderHook(() => useItineraryRealtime("itin-1", onUpdate));
    expect(FakeWebSocket.instances).toHaveLength(1);

    act(() => FakeWebSocket.instances[0].onclose?.());
    act(() => vi.advanceTimersByTime(3000));

    expect(FakeWebSocket.instances).toHaveLength(2);
  });

  it("does nothing when itineraryId is null", () => {
    renderHook(() => useItineraryRealtime(null, vi.fn()));
    expect(FakeWebSocket.instances).toHaveLength(0);
  });
});
