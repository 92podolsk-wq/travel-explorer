import { randomBytes } from "crypto";
import type { Itinerary, ItineraryStopPoint, ItinerarySummary } from "@/entities/itinerary/model/types";
import type { PlannedDay } from "@/shared/lib/itinerary-planner";
import { toCustomMarker } from "./custom-markers-repository";
import { toPoi, publicPhotosInclude, favoritesCountInclude, type PoiRow } from "./pois-repository";
import { prisma } from "./prisma-client";

const stopInclude = {
  poi: { include: { photos: publicPhotosInclude, _count: favoritesCountInclude } },
  customMarker: true
} as const;
const itineraryInclude = { stops: { include: stopInclude }, days: true } as const;

const MAX_ITINERARIES_PER_USER = 3;

type ItineraryRow = Awaited<
  ReturnType<typeof prisma.itinerary.findFirstOrThrow<{ include: typeof itineraryInclude }>>
>;
type StopRow = ItineraryRow["stops"][number];

export class ItineraryLimitError extends Error {}

function toStopPoint(row: StopRow): ItineraryStopPoint {
  if (row.poi) {
    return { kind: "poi", poi: toPoi(row.poi as PoiRow) };
  }
  if (row.customMarker) {
    return { kind: "marker", marker: toCustomMarker(row.customMarker) };
  }
  throw new Error(`ItineraryStop ${row.id} has neither a poi nor a customMarker`);
}

function toItinerary(row: ItineraryRow): Itinerary {
  return {
    id: row.id,
    title: row.title,
    shareToken: row.shareToken,
    stops: [...row.stops]
      .sort((a, b) => (a.day !== b.day ? a.day - b.day : a.position - b.position))
      .map((stop) => ({
        id: stop.id,
        day: stop.day,
        position: stop.position,
        point: toStopPoint(stop),
        durationOverrideMinutes: stop.durationOverrideMinutes
      })),
    days: [...row.days]
      .sort((a, b) => a.day - b.day)
      .map((d) => ({
        day: d.day,
        title: d.title,
        startMinutes: d.startMinutes,
        lunchEnabled: d.lunchEnabled,
        lunchStartMinutes: d.lunchStartMinutes,
        lunchDurationMinutes: d.lunchDurationMinutes
      }))
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

async function loadItinerary(where: { id: string; userId: string } | { shareToken: string }): Promise<ItineraryRow | null> {
  const row =
    "shareToken" in where
      ? await prisma.itinerary.findUnique({ where: { shareToken: where.shareToken }, include: itineraryInclude })
      : await prisma.itinerary.findUnique({ where: { id: where.id }, include: itineraryInclude });

  if (!row || ("userId" in where && row.userId !== where.userId)) {
    return null;
  }

  const backfilled = await backfillMissingDays(
    row.id,
    row.stops.map((stop) => stop.day),
    row.days.map((d) => d.day)
  );

  if (!backfilled) {
    return row;
  }

  return loadItinerary(where);
}

export async function getItinerary(userId: string, itineraryId: string): Promise<Itinerary | null> {
  const row = await loadItinerary({ id: itineraryId, userId });
  return row ? toItinerary(row) : null;
}

export async function listItineraries(userId: string): Promise<ItinerarySummary[]> {
  return prisma.itinerary.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true }
  });
}

export async function createItinerary(userId: string, title?: string): Promise<Itinerary> {
  const count = await prisma.itinerary.count({ where: { userId } });
  if (count >= MAX_ITINERARIES_PER_USER) {
    throw new ItineraryLimitError();
  }

  const created = await prisma.itinerary.create({
    data: { userId, shareToken: generateShareToken(), ...(title ? { title } : {}) },
    include: itineraryInclude
  });

  return toItinerary(created);
}

export async function deleteItinerary(userId: string, itineraryId: string): Promise<boolean> {
  const owned = await prisma.itinerary.findUnique({ where: { id: itineraryId }, select: { userId: true } });
  if (!owned || owned.userId !== userId) {
    return false;
  }

  await prisma.itinerary.delete({ where: { id: itineraryId } });
  return true;
}

function nextStopPlacement(stops: { day: number; position: number }[]): { day: number; position: number } {
  const targetDay = stops.reduce((max, stop) => Math.max(max, stop.day), 1);
  const maxPosition = stops
    .filter((stop) => stop.day === targetDay)
    .reduce((max, stop) => Math.max(max, stop.position), -1);
  return { day: targetDay, position: maxPosition + 1 };
}

export async function addStop(userId: string, itineraryId: string, poiId: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const { day, position } = nextStopPlacement(itinerary.stops);

  await prisma.itineraryStop.upsert({
    where: { itineraryId_poiId: { itineraryId, poiId } },
    create: { itineraryId, poiId, day, position },
    update: {}
  });

  return getItinerary(userId, itineraryId);
}

export async function addStops(userId: string, itineraryId: string, poiIds: string[]): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const existingPoiIds = new Set(itinerary.stops.map((stop) => stop.poiId).filter((id): id is string => id != null));
  const { day: targetDay, position: startPosition } = nextStopPlacement(itinerary.stops);
  let nextPosition = startPosition;

  const newPoiIds = poiIds.filter((poiId) => !existingPoiIds.has(poiId));
  if (newPoiIds.length > 0) {
    await prisma.itineraryStop.createMany({
      data: newPoiIds.map((poiId) => ({
        itineraryId,
        poiId,
        day: targetDay,
        position: nextPosition++
      }))
    });
  }

  return getItinerary(userId, itineraryId);
}

export async function addMarkerStop(userId: string, itineraryId: string, customMarkerId: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const marker = await prisma.customMarker.findUnique({ where: { id: customMarkerId }, select: { userId: true } });
  if (!marker || marker.userId !== userId) {
    return null;
  }

  const { day, position } = nextStopPlacement(itinerary.stops);

  await prisma.itineraryStop.upsert({
    where: { itineraryId_customMarkerId: { itineraryId, customMarkerId } },
    create: { itineraryId, customMarkerId, day, position },
    update: {}
  });

  return getItinerary(userId, itineraryId);
}

export async function clearStops(userId: string, itineraryId: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  await prisma.$transaction([
    prisma.itineraryStop.deleteMany({ where: { itineraryId } }),
    prisma.itineraryDay.deleteMany({ where: { itineraryId } }),
    prisma.itinerary.update({ where: { id: itineraryId }, data: { title: "Мой маршрут" } })
  ]);

  return getItinerary(userId, itineraryId);
}

export async function removeStopById(userId: string, itineraryId: string, stopId: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  await prisma.itineraryStop.deleteMany({ where: { id: stopId, itineraryId } });
  return getItinerary(userId, itineraryId);
}

export async function reorderDayStops(
  userId: string,
  itineraryId: string,
  day: number,
  orderedStopIds: string[]
): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const dayStopIds = new Set(itinerary.stops.filter((stop) => stop.day === day).map((stop) => stop.id));
  if (orderedStopIds.length !== dayStopIds.size || !orderedStopIds.every((id) => dayStopIds.has(id))) {
    return null;
  }

  await prisma.$transaction(
    orderedStopIds.map((stopId, index) =>
      prisma.itineraryStop.update({
        where: { id: stopId },
        data: { position: index }
      })
    )
  );

  return getItinerary(userId, itineraryId);
}

export async function updateStopById(
  userId: string,
  itineraryId: string,
  stopId: string,
  patch: { day?: number; durationOverrideMinutes?: number | null }
): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const stop = itinerary.stops.find((s) => s.id === stopId);
  if (!stop) {
    return null;
  }

  const data: { day?: number; position?: number; durationOverrideMinutes?: number | null } = {};
  if (patch.day != null && patch.day !== stop.day) {
    const maxPosition = itinerary.stops
      .filter((s) => s.day === patch.day && s.id !== stopId)
      .reduce((max, s) => Math.max(max, s.position), -1);
    data.day = patch.day;
    data.position = maxPosition + 1;
  }
  if (patch.durationOverrideMinutes !== undefined) {
    data.durationOverrideMinutes = patch.durationOverrideMinutes;
  }

  await prisma.itineraryStop.update({
    where: { id: stopId },
    data
  });

  return getItinerary(userId, itineraryId);
}

export async function moveStopToDayWithOrder(
  userId: string,
  itineraryId: string,
  stopId: string,
  day: number,
  orderedStopIds: string[]
): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const stop = itinerary.stops.find((s) => s.id === stopId);
  if (!stop) {
    return null;
  }

  await prisma.$transaction([
    prisma.itineraryStop.update({ where: { id: stopId }, data: { day } }),
    ...orderedStopIds.map((id, index) =>
      prisma.itineraryStop.update({
        where: { id },
        data: { position: index }
      })
    )
  ]);

  return getItinerary(userId, itineraryId);
}

export async function generateItinerary(
  userId: string,
  itineraryId: string,
  plan: PlannedDay[],
  title?: string
): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const stopData = plan.flatMap((planDay, dayIndex) =>
    planDay.pois.map((poi, position) => ({ itineraryId, poiId: poi.id, day: dayIndex + 1, position }))
  );
  const dayData = plan.map((planDay, dayIndex) => ({
    itineraryId,
    day: dayIndex + 1,
    title: planDay.suggestedTitle
  }));

  await prisma.$transaction([
    prisma.itineraryStop.deleteMany({ where: { itineraryId } }),
    prisma.itineraryDay.deleteMany({ where: { itineraryId } }),
    ...(stopData.length > 0 ? [prisma.itineraryStop.createMany({ data: stopData })] : []),
    ...(dayData.length > 0 ? [prisma.itineraryDay.createMany({ data: dayData })] : []),
    ...(title ? [prisma.itinerary.update({ where: { id: itineraryId }, data: { title } })] : [])
  ]);

  return getItinerary(userId, itineraryId);
}

export async function renameItinerary(userId: string, itineraryId: string, title: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  await prisma.itinerary.update({ where: { id: itineraryId }, data: { title } });
  return getItinerary(userId, itineraryId);
}

export async function addDay(userId: string, itineraryId: string): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  const nextDay =
    Math.max(0, ...itinerary.stops.map((stop) => stop.day), ...itinerary.days.map((day) => day.day)) + 1;

  await prisma.itineraryDay.create({ data: { itineraryId, day: nextDay, title: null } });
  return getItinerary(userId, itineraryId);
}

export async function removeDay(userId: string, itineraryId: string, day: number): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  await prisma.$transaction([
    prisma.itineraryStop.deleteMany({ where: { itineraryId, day } }),
    prisma.itineraryDay.deleteMany({ where: { itineraryId, day } })
  ]);

  return getItinerary(userId, itineraryId);
}

export async function updateDay(
  userId: string,
  itineraryId: string,
  day: number,
  patch: {
    title?: string;
    startMinutes?: number | null;
    lunchEnabled?: boolean | null;
    lunchStartMinutes?: number | null;
    lunchDurationMinutes?: number | null;
  }
): Promise<Itinerary | null> {
  const itinerary = await loadItinerary({ id: itineraryId, userId });
  if (!itinerary) {
    return null;
  }

  await prisma.itineraryDay.upsert({
    where: { itineraryId_day: { itineraryId, day } },
    create: { itineraryId, day, title: patch.title ?? null, ...patch },
    update: patch
  });

  return getItinerary(userId, itineraryId);
}

export async function getItineraryByShareToken(token: string): Promise<Itinerary | null> {
  const row = await loadItinerary({ shareToken: token });
  if (!row) return null;
  const itinerary = toItinerary(row);
  return { ...itinerary, stops: itinerary.stops.filter((stop) => stop.point.kind === "poi") };
}
