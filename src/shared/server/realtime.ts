// The actual WebSocket server/rooms live in server.js (a plain CommonJS
// script outside Next's build, since it owns the raw HTTP server — see that
// file for why). It exposes a broadcast hub on globalThis at startup; this
// module is the typed door into it for API route handlers running inside
// the Next app. A no-op fallback keeps `next dev` (which doesn't run
// server.js) from throwing when a mutation route calls this.
type RealtimeHub = { broadcast: (itineraryId: string) => void };

export function broadcastItineraryUpdate(itineraryId: string) {
  const hub = (globalThis as unknown as { __wayoraRealtimeHub?: RealtimeHub }).__wayoraRealtimeHub;
  hub?.broadcast(itineraryId);
}
