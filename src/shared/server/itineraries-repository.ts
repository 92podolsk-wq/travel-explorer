import { randomBytes } from "crypto";
import type { Itinerary } from "@/entities/itinerary/model/types";
import type { PlannedDay } from "@/shared/lib/itinerary-planner";
import { toPoi, type PoiRow } from "./pois-repository";
import { prisma } from "./prisma-client";

const stopInclude = { poi: { include: { photos: true } } } as const;
const itineraryInclude = { stops: { include: stopInclude }, days: true } as const;

type ItineraryRow = Awaited<
  ReturnType<typeof prisma.itinerary.findFirstOrThrow<{ include: typeof itineraryInclude }>>
>;

function toItinerary(row: ItineraryRow): Itinerary {
  return {
    id: row.id,
    title: row.title,
    shareToken: row.shareToken,
    stops: [...row.stops]
      .sort((a, b) => (a.day !== b.day ? a.day - b.day : a.position - b.position))
      .map((stop) => ({ id: stop.id, day: stop.day, position: stop.position, poi: toPoi(stop.poi as PoiRow) })),
    days: [...row.days].sort((a, b) => a.day - b.day).map((d) => ({ day: d.day, title: d.title }))
  };
}

function generateShareToken() {
  return randomBytes(16).toString("hex");
}

/** Ensures every day referenced by a stop has a matching ItineraryDay row, self-healing itineraries created before that table existed. */
async function backfillMissingDays(itineraryId: string, stopDays: number[], existingDays: number[]): Promise<boolean> {
  const existing = new Set(existingDays);
  const missing = [...new Set(stopDays)].filter((day) => !existing.has(day));

  if (missing.length === 0) {
    return false;
  }

  await prisma.itineraryDay.createMany({
    data: missing.map((day) => ({ itineraryId, day, title: null })),
    skipDuplicates: true
  });

  return true;
}

async function loadItinerary(where: { userId: string } | { shareToken: string }): Promise<ItineraryRow | null> {
  const row = await prisma.itinerary.findUnique({ where, include: itineraryInclude });
  if (!row) return null;

  const backfilled = await backfillMissingDays(
    row.id,
    row.stops.map((stop) => stop.day),
    row.days.map((d) => d.day)
  );

  if (!backfilled) {
    return row;
  }

  return prisma.itinerary.findUnique({ where, include: itineraryInclude });
}

export async function getOrCreateItinerary(userId: string): Promise<Itinerary> {
  const existing = await loadItinerary({ userId });
  if (existing) {
    return toItinerary(existing);
  }

  const created = await prisma.itinerary.create({
    data: { userId, shareToken: generateShareToken() },
    include: itineraryInclude
  });

  return toItinerary(created);
}

export async function addStop(userId: string, poiId: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, shareToken: generateShareToken() },
    update: {}
  });

  const existingStops = await prisma.itineraryStop.findMany({ where: { itineraryId: itinerary.id } });
  const targetDay = existingStops.reduce((max, stop) => Math.max(max, stop.day), 1);
  const maxPosition = existingStops
    .filter((stop) => stop.day === targetDay)
    .reduce((max, stop) => Math.max(max, stop.position), -1);

  await prisma.itineraryStop.upsert({
    where: { itineraryId_poiId: { itineraryId: itinerary.id, poiId } },
    create: { itineraryId: itinerary.id, poiId, day: targetDay, position: maxPosition + 1 },
    update: {}
  });

  return getOrCreateItinerary(userId);
}

export async function addStops(userId: string, poiIds: string[]): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, shareToken: generateShareToken() },
    update: {}
  });

  const existingStops = await prisma.itineraryStop.findMany({ where: { itineraryId: itinerary.id } });
  const existingPoiIds = new Set(existingStops.map((stop) => stop.poiId));
  const targetDay = existingStops.reduce((max, stop) => Math.max(max, stop.day), 1);
  let nextPosition =
    existingStops.filter((stop) => stop.day === targetDay).reduce((max, stop) => Math.max(max, stop.position), -1) +
    1;

  const newPoiIds = poiIds.filter((poiId) => !existingPoiIds.has(poiId));
  if (newPoiIds.length > 0) {
    await prisma.itineraryStop.createMany({
      data: newPoiIds.map((poiId) => ({
        itineraryId: itinerary.id,
        poiId,
        day: targetDay,
        position: nextPosition++
      }))
    });
  }

  return getOrCreateItinerary(userId);
}

export async function clearStops(userId: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId } });
  if (itinerary) {
    await prisma.$transaction([
      prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id } }),
      prisma.itineraryDay.deleteMany({ where: { itineraryId: itinerary.id } }),
      prisma.itinerary.update({ where: { id: itinerary.id }, data: { title: "Мой маршрут" } })
    ]);
  }

  return getOrCreateItinerary(userId);
}

export async function removeStop(userId: string, poiId: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId } });
  if (itinerary) {
    await prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id, poiId } });
  }

  return getOrCreateItinerary(userId);
}

export async function reorderDayStops(userId: string, day: number, orderedPoiIds: string[]): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId }, include: { stops: true } });
  if (!itinerary) {
    return null;
  }

  const dayPoiIds = new Set(itinerary.stops.filter((stop) => stop.day === day).map((stop) => stop.poiId));
  if (orderedPoiIds.length !== dayPoiIds.size || !orderedPoiIds.every((id) => dayPoiIds.has(id))) {
    return null;
  }

  await prisma.$transaction(
    orderedPoiIds.map((poiId, index) =>
      prisma.itineraryStop.update({
        where: { itineraryId_poiId: { itineraryId: itinerary.id, poiId } },
        data: { position: index }
      })
    )
  );

  return getOrCreateItinerary(userId);
}

export async function moveStopToDay(userId: string, poiId: string, day: number): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId }, include: { stops: true } });
  if (!itinerary) {
    return null;
  }

  const stop = itinerary.stops.find((s) => s.poiId === poiId);
  if (!stop) {
    return null;
  }

  const maxPosition = itinerary.stops
    .filter((s) => s.day === day && s.poiId !== poiId)
    .reduce((max, s) => Math.max(max, s.position), -1);

  await prisma.itineraryStop.update({
    where: { itineraryId_poiId: { itineraryId: itinerary.id, poiId } },
    data: { day, position: maxPosition + 1 }
  });

  return getOrCreateItinerary(userId);
}

export async function generateItinerary(userId: string, plan: PlannedDay[], title?: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, shareToken: generateShareToken(), ...(title ? { title } : {}) },
    update: title ? { title } : {}
  });

  const stopData = plan.flatMap((planDay, dayIndex) =>
    planDay.pois.map((poi, position) => ({ itineraryId: itinerary.id, poiId: poi.id, day: dayIndex + 1, position }))
  );
  const dayData = plan.map((planDay, dayIndex) => ({
    itineraryId: itinerary.id,
    day: dayIndex + 1,
    title: planDay.suggestedTitle
  }));

  await prisma.$transaction([
    prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id } }),
    prisma.itineraryDay.deleteMany({ where: { itineraryId: itinerary.id } }),
    ...(stopData.length > 0 ? [prisma.itineraryStop.createMany({ data: stopData })] : []),
    ...(dayData.length > 0 ? [prisma.itineraryDay.createMany({ data: dayData })] : [])
  ]);

  return getOrCreateItinerary(userId);
}

export async function renameItinerary(userId: string, title: string): Promise<Itinerary> {
  await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, title, shareToken: generateShareToken() },
    update: { title }
  });

  return getOrCreateItinerary(userId);
}

export async function addDay(userId: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, shareToken: generateShareToken() },
    update: {}
  });

  const [stops, days] = await Promise.all([
    prisma.itineraryStop.findMany({ where: { itineraryId: itinerary.id } }),
    prisma.itineraryDay.findMany({ where: { itineraryId: itinerary.id } })
  ]);

  const nextDay =
    Math.max(0, ...stops.map((stop) => stop.day), ...days.map((day) => day.day)) + 1;

  await prisma.itineraryDay.create({ data: { itineraryId: itinerary.id, day: nextDay, title: null } });

  return getOrCreateItinerary(userId);
}

export async function removeDay(userId: string, day: number): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId } });
  if (!itinerary) {
    return null;
  }

  await prisma.$transaction([
    prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id, day } }),
    prisma.itineraryDay.deleteMany({ where: { itineraryId: itinerary.id, day } })
  ]);

  return getOrCreateItinerary(userId);
}

export async function renameDay(userId: string, day: number, title: string): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId } });
  if (!itinerary) {
    return null;
  }

  await prisma.itineraryDay.upsert({
    where: { itineraryId_day: { itineraryId: itinerary.id, day } },
    create: { itineraryId: itinerary.id, day, title },
    update: { title }
  });

  return getOrCreateItinerary(userId);
}

export async function getItineraryByShareToken(token: string): Promise<Itinerary | null> {
  const row = await loadItinerary({ shareToken: token });
  return row ? toItinerary(row) : null;
}
