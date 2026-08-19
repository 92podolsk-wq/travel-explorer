import type { FriendEntry, FriendUser } from "@/entities/user/model/types";
import { prisma } from "./prisma-client";
import { isUserOnline } from "./realtime";

const FRIEND_USER_SELECT = { id: true, username: true, name: true, avatarId: true, lastSeenAt: true } as const;

type FriendUserRow = { id: string; username: string; name: string | null; avatarId: string | null; lastSeenAt: Date | null };

function toFriendUser(row: FriendUserRow): FriendUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    avatarId: row.avatarId,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    isOnline: isUserOnline(row.id)
  };
}

export async function searchUsersByUsername(query: string, excludingUserId: string, limit = 10): Promise<FriendUser[]> {
  const rows = await prisma.user.findMany({
    where: {
      username: { contains: query, mode: "insensitive" },
      hideFromSearch: false,
      id: { not: excludingUserId }
    },
    select: FRIEND_USER_SELECT,
    take: limit,
    orderBy: { username: "asc" }
  });
  return rows.map(toFriendUser);
}

// If the other person already sent us a request, sending one back accepts
// theirs instead of creating a duplicate row in the opposite direction.
export async function sendFriendRequest(requesterId: string, addresseeId: string): Promise<{ status: string } | null> {
  if (requesterId === addresseeId) return null;

  const reverse = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: requesterId } }
  });
  if (reverse) {
    if (reverse.status === "accepted") return reverse;
    return prisma.friendship.update({ where: { id: reverse.id }, data: { status: "accepted" } });
  }

  return prisma.friendship.upsert({
    where: { requesterId_addresseeId: { requesterId, addresseeId } },
    update: {},
    create: { requesterId, addresseeId, status: "pending" }
  });
}

export async function acceptFriendRequest(friendshipId: string, currentUserId: string) {
  const row = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!row || row.addresseeId !== currentUserId || row.status !== "pending") return null;
  return prisma.friendship.update({ where: { id: friendshipId }, data: { status: "accepted" } });
}

// Covers declining an incoming request, cancelling an outgoing one, and
// removing an existing friend — all are just deleting the row, and only
// a participant may do it.
export async function removeFriendship(friendshipId: string, currentUserId: string): Promise<boolean> {
  const row = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!row || (row.requesterId !== currentUserId && row.addresseeId !== currentUserId)) return false;
  await prisma.friendship.delete({ where: { id: friendshipId } });
  return true;
}

export async function listFriends(userId: string): Promise<FriendEntry[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "accepted", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: { requester: { select: FRIEND_USER_SELECT }, addressee: { select: FRIEND_USER_SELECT } },
    orderBy: { createdAt: "desc" }
  });
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    user: toFriendUser(row.requesterId === userId ? row.addressee : row.requester)
  }));
}

export async function listIncomingRequests(userId: string): Promise<FriendEntry[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "pending", addresseeId: userId },
    include: { requester: { select: FRIEND_USER_SELECT } },
    orderBy: { createdAt: "desc" }
  });
  return rows.map((row) => ({ id: row.id, createdAt: row.createdAt.toISOString(), user: toFriendUser(row.requester) }));
}

export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  const row = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: userIdA, addresseeId: userIdB },
        { requesterId: userIdB, addresseeId: userIdA }
      ]
    },
    select: { id: true }
  });
  return row !== null;
}

export async function listOutgoingRequests(userId: string): Promise<FriendEntry[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "pending", requesterId: userId },
    include: { addressee: { select: FRIEND_USER_SELECT } },
    orderBy: { createdAt: "desc" }
  });
  return rows.map((row) => ({ id: row.id, createdAt: row.createdAt.toISOString(), user: toFriendUser(row.addressee) }));
}
