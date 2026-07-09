import { prisma } from "./prisma-client";

export type TopPoiStat = {
  poiId: string;
  poiName: string;
  regionId: string;
  count: number;
};

export type DayCount = {
  date: string;
  count: number;
};

export type ActivitySummary = {
  periodDays: number;
  newUsers: number;
  totalUsers: number;
  totalPois: number;
  viewedEvents: number;
  favoritedEvents: number;
  visitedEvents: number;
};

async function enrichWithPoiInfo(counts: Array<{ poiId: string; count: number }>): Promise<TopPoiStat[]> {
  if (counts.length === 0) {
    return [];
  }

  const pois = await prisma.poi.findMany({
    where: { id: { in: counts.map((c) => c.poiId) } },
    select: { id: true, name: true, regionId: true }
  });
  const poiById = new Map(pois.map((poi) => [poi.id, poi]));

  return counts
    .map(({ poiId, count }) => {
      const poi = poiById.get(poiId);
      return poi ? { poiId, poiName: poi.name, regionId: poi.regionId, count } : null;
    })
    .filter((stat): stat is TopPoiStat => stat !== null);
}

export async function getTopPoisByViews(limit = 5): Promise<TopPoiStat[]> {
  const grouped = await prisma.viewedPoi.groupBy({
    by: ["poiId"],
    _count: { poiId: true },
    orderBy: { _count: { poiId: "desc" } },
    take: limit
  });

  return enrichWithPoiInfo(grouped.map((row) => ({ poiId: row.poiId, count: row._count.poiId })));
}

export async function getTopPoisByFavorites(limit = 5): Promise<TopPoiStat[]> {
  const grouped = await prisma.favorite.groupBy({
    by: ["poiId"],
    _count: { poiId: true },
    orderBy: { _count: { poiId: "desc" } },
    take: limit
  });

  return enrichWithPoiInfo(grouped.map((row) => ({ poiId: row.poiId, count: row._count.poiId })));
}

export async function getUserGrowth(days = 30): Promise<DayCount[]> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<Array<{ day: Date; count: bigint }>>`
    SELECT date_trunc('day', "createdAt") as day, COUNT(*)::bigint as count
    FROM "User"
    WHERE "createdAt" >= ${cutoff}
    GROUP BY day
    ORDER BY day ASC
  `;

  return rows.map((row) => ({ date: row.day.toISOString().slice(0, 10), count: Number(row.count) }));
}

export async function getActivitySummary(days = 7): Promise<ActivitySummary> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [newUsers, totalUsers, totalPois, viewedEvents, favoritedEvents, visitedEvents] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: cutoff } } }),
    prisma.user.count(),
    prisma.poi.count(),
    prisma.viewedPoi.count({ where: { viewedAt: { gte: cutoff } } }),
    prisma.favorite.count({ where: { createdAt: { gte: cutoff } } }),
    prisma.visitedPoi.count({ where: { visitedAt: { gte: cutoff } } })
  ]);

  return { periodDays: days, newUsers, totalUsers, totalPois, viewedEvents, favoritedEvents, visitedEvents };
}
