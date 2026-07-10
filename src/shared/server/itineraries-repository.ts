import { randomBytes } from "crypto";
import type { Itinerary } from "@/entities/itinerary/model/types";
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
      .sort((a, b) => a.position - b.position)
      .map((stop) => ({ id: stop.id, position: stop.position, poi: toPoi(stop.poi as PoiRow) }))
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

  const maxPosition = await prisma.itineraryStop.aggregate({
    where: { itineraryId: itinerary.id },
    _max: { position: true }
  });

  await prisma.itineraryStop.upsert({
    where: { itineraryId_poiId: { itineraryId: itinerary.id, poiId } },
    create: { itineraryId: itinerary.id, poiId, position: (maxPosition._max.position ?? -1) + 1 },
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

export async function reorderStops(userId: string, orderedPoiIds: string[]): Promise<Itinerary | null> {
  const itinerary = await prisma.itinerary.findUnique({ where: { userId }, include: { stops: true } });
  if (!itinerary) {
    return null;
  }

  const currentPoiIds = new Set(itinerary.stops.map((stop) => stop.poiId));
  if (orderedPoiIds.length !== itinerary.stops.length || !orderedPoiIds.every((id) => currentPoiIds.has(id))) {
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
