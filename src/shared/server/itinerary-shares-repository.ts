import type { FriendUser } from "@/entities/user/model/types";
import type { SharedItinerarySummary } from "@/entities/sharing/model/types";
import { prisma } from "./prisma-client";
import { areFriends } from "./friendships-repository";

const FRIEND_USER_SELECT = { id: true, username: true, name: true, avatarId: true } as const;

function toFriendUser(row: { id: string; username: string; name: string | null; avatarId: string | null }): FriendUser {
  return { id: row.id, username: row.username, name: row.name, avatarId: row.avatarId };
}

// Returns false if the itinerary isn't owned by ownerId or the two users
// aren't friends, so the route can 403/404 instead of creating a dangling share.
export async function shareItinerary(itineraryId: string, ownerId: string, sharedWithId: string): Promise<boolean> {
  if (ownerId === sharedWithId || !(await areFriends(ownerId, sharedWithId))) {
    return false;
  }
  const itinerary = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { userId: true } });
  if (!itinerary || itinerary.userId !== ownerId) {
    return false;
  }
  await prisma.itineraryShare.upsert({
    where: { itineraryId_sharedWithId: { itineraryId, sharedWithId } },
    update: {},
    create: { itineraryId, ownerId, sharedWithId }
  });
  return true;
}

export async function unshareItinerary(itineraryId: string, ownerId: string, sharedWithId: string): Promise<boolean> {
  const result = await prisma.itineraryShare
    .deleteMany({ where: { itineraryId, ownerId, sharedWithId } })
    .catch(() => ({ count: 0 }));
  return result.count > 0;
}

export async function listItineraryShareTargets(itineraryId: string, ownerId: string): Promise<FriendUser[]> {
  const rows = await prisma.itineraryShare.findMany({
    where: { itineraryId, ownerId },
    include: { sharedWith: { select: FRIEND_USER_SELECT } }
  });
  return rows.map((row) => toFriendUser(row.sharedWith));
}

export async function listItinerariesSharedWithMe(userId: string): Promise<SharedItinerarySummary[]> {
  const rows = await prisma.itineraryShare.findMany({
    where: { sharedWithId: userId },
    include: {
      owner: { select: FRIEND_USER_SELECT },
      itinerary: { select: { id: true, title: true } }
    }
  });
  return rows.map((row) => ({ owner: toFriendUser(row.owner), itinerary: row.itinerary }));
}

// Confirms sharedWithId actually has access to this itinerary before the
// route hands back full stop/day data.
export async function hasItineraryShareAccess(itineraryId: string, sharedWithId: string): Promise<boolean> {
  const row = await prisma.itineraryShare.findFirst({ where: { itineraryId, sharedWithId }, select: { id: true } });
  return row !== null;
}
