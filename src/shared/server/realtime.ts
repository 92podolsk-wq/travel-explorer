// The actual WebSocket server/rooms live in server.mts (a custom entry point
// outside Next's own request handling, since it owns the raw HTTP server —
// see that file for why). It exposes a hub on globalThis at startup; this
// module is the typed door into it for API route handlers running inside
// the Next app. No-op fallbacks keep `next dev` (which doesn't run
// server.mts) from throwing when a route calls these.
type RealtimeHub = {
  broadcast: (itineraryId: string) => void;
  isUserOnline?: (userId: string) => boolean;
};

export function broadcastItineraryUpdate(itineraryId: string) {
  const hub = (globalThis as unknown as { __wayoraRealtimeHub?: RealtimeHub }).__wayoraRealtimeHub;
  hub?.broadcast(itineraryId);
}

export function isUserOnline(userId: string): boolean {
  const hub = (globalThis as unknown as { __wayoraRealtimeHub?: RealtimeHub }).__wayoraRealtimeHub;
  return hub?.isUserOnline?.(userId) ?? false;
}
