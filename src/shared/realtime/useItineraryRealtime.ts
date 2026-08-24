import { useEffect, useState } from "react";
import { apiFetch } from "@/shared/lib/api-fetch";
import type { Itinerary } from "@/entities/itinerary/model/types";

export type ItineraryPresenceUser = { id: string; name: string | null; username: string; avatarId: string | null };

const RECONNECT_DELAY_MS = 3000;

// Live updates for collaborative trip editing: a companion's mutation
// broadcasts over this socket (see server.mts + src/shared/server/
// realtime.ts), and we just refetch — no need to reconcile a partial
// payload since GET /api/me/itineraries/[id] is already cheap. The same
// socket also carries presence: who else currently has this trip open.
// The browser's WebSocket sends the session cookie same-origin
// automatically, unlike the native app's equivalent hook which has to pass
// a bearer token via a non-standard constructor argument.
//
// `onUpdate` must be referentially stable (e.g. a Zustand setter) — it's in
// the effect's dependency array, so a new function identity on every render
// tears down and reconnects the socket every render.
export function useItineraryRealtime(itineraryId: string | null | undefined, onUpdate: (itinerary: Itinerary) => void) {
  const [presenceUsers, setPresenceUsers] = useState<ItineraryPresenceUser[]>([]);

  useEffect(() => {
    if (!itineraryId || typeof window === "undefined") return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (cancelled) return;
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${wsProtocol}//${window.location.host}/realtime`);

      socket.onopen = () => {
        socket?.send(JSON.stringify({ type: "subscribe", itineraryId }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "itinerary:updated" && message.itineraryId === itineraryId) {
            apiFetch(`/api/me/itineraries/${itineraryId}`).then((res) => {
              if (res.ok && !cancelled) res.json().then(onUpdate);
            });
          } else if (message.type === "presence" && message.itineraryId === itineraryId) {
            setPresenceUsers(message.users);
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        if (!cancelled) setPresenceUsers([]);
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      setPresenceUsers([]);
    };
  }, [itineraryId, onUpdate]);

  return presenceUsers;
}
