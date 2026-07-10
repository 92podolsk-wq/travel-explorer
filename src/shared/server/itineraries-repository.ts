import { randomBytes } from "crypto";
import type { Itinerary } from "@/entities/itinerary/model/types";
import type { Poi } from "@/entities/poi/model/types";
import { toPoi, type PoiRow } from "./pois-repository";
import { prisma } from "./prisma-client";

const stopInclude = { poi: { include: { photos: true } } } as const;

type ItineraryRow = Awaited<
  ReturnType<typeof prisma.itinerary.findFirstOrThrow<{ include: { stops: { include: typeof stopInclude } } }>>
>;

function toItinerary(row: ItineraryRow): Itinerary {
  return {
    id: row.id,
    title: row.title,
    shareToken: row.shareToken,
    stops: [...row.stops]
      .sort((a, b) => (a.day !== b.day ? a.day - b.day : a.position - b.position))
      .map((stop) => ({ id: stop.id, day: stop.day, position: stop.position, poi: toPoi(stop.poi as PoiRow) }))
  };
}

function generateShareToken() {
  return randomBytes(16).toString("hex");
}

export async function getOrCreateItinerary(userId: string): Promise<Itinerary> {
  const existing = await prisma.itinerary.findUnique({
    where: { userId },
    include: { stops: { include: stopInclude } }
  });

  if (existing) {
    return toItinerary(existing);
  }

  const created = await prisma.itinerary.create({
    data: { userId, shareToken: generateShareToken() },
    include: { stops: { include: stopInclude } }
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

export async function generateItinerary(userId: string, plan: Poi[][], title?: string): Promise<Itinerary> {
  const itinerary = await prisma.itinerary.upsert({
    where: { userId },
    create: { userId, shareToken: generateShareToken(), ...(title ? { title } : {}) },
    update: title ? { title } : {}
  });

  await prisma.itineraryStop.deleteMany({ where: { itineraryId: itinerary.id } });

  const data = plan.flatMap((dayStops, dayIndex) =>
    dayStops.map((poi, position) => ({ itineraryId: itinerary.id, poiId: poi.id, day: dayIndex + 1, position }))
  );

  if (data.length > 0) {
    await prisma.itineraryStop.createMany({ data });
  }

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

export async function getItineraryByShareToken(token: string): Promise<Itinerary | null> {
  const row = await prisma.itinerary.findUnique({
    where: { shareToken: token },
    include: { stops: { include: stopInclude } }
  });

  return row ? toItinerary(row) : null;
}
