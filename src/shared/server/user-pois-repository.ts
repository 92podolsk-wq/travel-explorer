import type { UserPoiState } from "@/entities/user/model/types";
import { prisma } from "./prisma-client";

export async function getUserPoiState(userId: string): Promise<UserPoiState> {
  const [favorites, viewed, visited] = await Promise.all([
    prisma.favorite.findMany({ where: { userId }, select: { poiId: true } }),
    prisma.viewedPoi.findMany({ where: { userId }, select: { poiId: true } }),
    prisma.visitedPoi.findMany({ where: { userId }, select: { poiId: true } })
  ]);

  return {
    favoritePoiIds: favorites.map((row) => row.poiId),
    viewedPoiIds: viewed.map((row) => row.poiId),
    visitedPoiIds: visited.map((row) => row.poiId)
  };
}

export async function toggleFavorite(userId: string, poiId: string): Promise<boolean> {
  const existing = await prisma.favorite.findUnique({ where: { userId_poiId: { userId, poiId } } });

  if (existing) {
    await prisma.favorite.delete({ where: { userId_poiId: { userId, poiId } } });
    return false;
  }

  await prisma.favorite.create({ data: { userId, poiId } });
  return true;
}

export async function toggleVisited(userId: string, poiId: string): Promise<boolean> {
  const existing = await prisma.visitedPoi.findUnique({ where: { userId_poiId: { userId, poiId } } });

  if (existing) {
    await prisma.visitedPoi.delete({ where: { userId_poiId: { userId, poiId } } });
    return false;
  }

  await prisma.visitedPoi.create({ data: { userId, poiId } });
  return true;
}

export async function markViewed(userId: string, poiId: string): Promise<void> {
  await prisma.viewedPoi.upsert({
    where: { userId_poiId: { userId, poiId } },
    create: { userId, poiId },
    update: {}
  });
}
