import { createServer, type IncomingMessage } from "http";
import { createHash } from "crypto";
import type { WebSocket } from "ws";
import nextEnv from "@next/env";

// Must run before anything below imports prisma-client.ts (which reads
// process.env.DATABASE_URL at module-evaluation time) — static `import`
// declarations elsewhere in this file would otherwise all evaluate before
// this call regardless of source order, so those imports are dynamic.
nextEnv.loadEnvConfig(process.cwd());

const next = (await import("next")).default;
const { WebSocketServer } = await import("ws");
const { prisma } = await import("./src/shared/server/prisma-client");

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const WS_PATH = "/realtime";

const app = next({ dev });
const handle = app.getRequestHandler();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

// Mirrors src/shared/server/user-auth.ts's getCurrentUser() — bearer token
// (native app) takes priority, falling back to the httpOnly session cookie
// (browser). Duplicated rather than imported since that module reads Next's
// request-scoped headers()/cookies() APIs, which don't exist on a raw HTTP
// upgrade request outside a route handler.
async function authenticateUpgrade(request: IncomingMessage) {
  const authHeader = request.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = bearerToken ?? parseCookie(request.headers.cookie, "te_user_session");
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || session.user.isBlocked) return null;
  return session.user;
}

async function canAccessItinerary(userId: string, itineraryId: string) {
  const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { userId: true } });
  if (!itinerary) return false;
  if (itinerary.userId === userId) return true;
  const share = await prisma.itineraryShare.findFirst({ where: { itineraryId, sharedWithId: userId }, select: { id: true } });
  return share !== null;
}

type PresenceUser = { id: string; name: string | null; username: string; avatarId: string | null };
type RealtimeSocket = WebSocket & { user?: PresenceUser };

// itineraryId -> Set<WebSocket>. Single pm2 process, so an in-memory map is
// sufficient — no cross-process pub/sub needed.
const rooms = new Map<string, Set<RealtimeSocket>>();

function joinRoom(itineraryId: string, ws: RealtimeSocket) {
  let room = rooms.get(itineraryId);
  if (!room) {
    room = new Set();
    rooms.set(itineraryId, room);
  }
  room.add(ws);
  broadcastPresence(itineraryId);
}

function leaveRoom(itineraryId: string, ws: RealtimeSocket) {
  const room = rooms.get(itineraryId);
  if (!room?.delete(ws)) return;
  if (room.size === 0) rooms.delete(itineraryId);
  broadcastPresence(itineraryId);
}

function leaveAllRooms(ws: RealtimeSocket) {
  for (const itineraryId of [...rooms.keys()]) {
    leaveRoom(itineraryId, ws);
  }
}

function broadcast(itineraryId: string) {
  const room = rooms.get(itineraryId);
  if (!room) return;
  const payload = JSON.stringify({ type: "itinerary:updated", itineraryId });
  for (const client of room) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

// Who's currently viewing this itinerary — sent to everyone in the room
// whenever membership changes, so the trip UI can show co-author avatars.
function broadcastPresence(itineraryId: string) {
  const room = rooms.get(itineraryId);
  if (!room) return;
  const byUserId = new Map<string, PresenceUser>();
  for (const client of room) {
    if (client.user) byUserId.set(client.user.id, client.user);
  }
  const payload = JSON.stringify({ type: "presence", itineraryId, users: [...byUserId.values()] });
  for (const client of room) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

// Exposed to the rest of the Next app (same process) via globalThis, since
// API route handlers can't import this entry file (it owns the raw HTTP
// server startup, not something a route module should trigger). See
// src/shared/server/realtime.ts for the typed consumer side.
(globalThis as unknown as { __wayoraRealtimeHub?: { broadcast: typeof broadcast } }).__wayoraRealtimeHub = { broadcast };

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (pathname !== WS_PATH) {
      socket.destroy();
      return;
    }

    authenticateUpgrade(request)
      .then((user) => {
        if (!user) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(request, socket, head, (ws: RealtimeSocket) => {
          ws.user = { id: user.id, name: user.name, username: user.username, avatarId: user.avatarId };
          wss.emit("connection", ws, request);
        });
      })
      .catch(() => {
        socket.destroy();
      });
  });

  wss.on("connection", (ws: RealtimeSocket) => {
    ws.on("message", (raw: Buffer) => {
      let message: { type?: string; itineraryId?: string };
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (message.type === "subscribe" && typeof message.itineraryId === "string" && ws.user) {
        const itineraryId = message.itineraryId;
        canAccessItinerary(ws.user.id, itineraryId).then((allowed) => {
          if (allowed && ws.readyState === ws.OPEN) joinRoom(itineraryId, ws);
        });
      } else if (message.type === "unsubscribe" && typeof message.itineraryId === "string") {
        leaveRoom(message.itineraryId, ws);
      }
    });

    ws.on("close", () => leaveAllRooms(ws));
    ws.on("error", () => leaveAllRooms(ws));
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} (WS at ${WS_PATH})`);
  });
});
