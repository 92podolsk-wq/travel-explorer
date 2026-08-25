import type { FriendUser } from "@/entities/user/model/types";
import type { SharedChecklist } from "@/entities/sharing/model/types";
import { prisma } from "./prisma-client";
import { areFriends } from "./friendships-repository";
import { isUserOnline } from "./realtime";
import { toChecklist } from "./packing-checklist-repository";

const FRIEND_USER_SELECT = { id: true, username: true, name: true, avatarId: true, lastSeenAt: true } as const;

function toFriendUser(row: {
  id: string;
  username: string;
  name: string | null;
  avatarId: string | null;
  lastSeenAt: Date | null;
}): FriendUser {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    avatarId: row.avatarId,
    lastSeenAt: row.lastSeenAt ? row.lastSeenAt.toISOString() : null,
    isOnline: isUserOnline(row.id)
  };
}

// Returns null if the two users aren't friends, so the route can 403 instead
// of silently creating a share only the owner can see.
export async function shareChecklist(ownerId: string, sharedWithId: string): Promise<boolean> {
  if (ownerId === sharedWithId || !(await areFriends(ownerId, sharedWithId))) {
    return false;
  }
  await prisma.checklistShare.upsert({
    where: { ownerId_sharedWithId: { ownerId, sharedWithId } },
    update: {},
    create: { ownerId, sharedWithId }
  });
  return true;
}

export async function unshareChecklist(ownerId: string, sharedWithId: string): Promise<boolean> {
  const result = await prisma.checklistShare
    .delete({ where: { ownerId_sharedWithId: { ownerId, sharedWithId } } })
    .catch(() => null);
  return result !== null;
}

export async function listChecklistShareTargets(ownerId: string): Promise<FriendUser[]> {
  const rows = await prisma.checklistShare.findMany({
    where: { ownerId },
    include: { sharedWith: { select: FRIEND_USER_SELECT } }
  });
  return rows.map((row) => toFriendUser(row.sharedWith));
}

export async function listChecklistsSharedWithMe(userId: string): Promise<SharedChecklist[]> {
  const rows = await prisma.checklistShare.findMany({
    where: { sharedWithId: userId },
    include: {
      owner: { select: { ...FRIEND_USER_SELECT, packingChecklist: true } }
    }
  });
  return rows
    .filter((row) => row.owner.packingChecklist !== null)
    .map((row) => ({
      owner: toFriendUser(row.owner),
      checklist: toChecklist(row.owner.packingChecklist!)
    }));
}
