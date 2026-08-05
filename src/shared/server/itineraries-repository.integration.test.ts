import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PlannedDay } from "@/shared/lib/itinerary-planner";
import { prisma } from "./prisma-client";
import {
  ItineraryLimitError,
  addDay,
  addMarkerStop,
  addStop,
  addStops,
  clearStops,
  createItinerary,
  deleteItinerary,
  generateItinerary,
  getItineraryByShareToken,
  listItineraries,
  moveStopToDayWithOrder,
  removeDay,
  removeStopById,
  renameItinerary,
  reorderDayStops,
  updateDay,
  updateItineraryStartDate,
  updateStopById
} from "./itineraries-repository";

const countryId = "itin-test-country";
const areaId = "itin-test-area";
const regionId = "itin-test-region";
const userEmail = "itin-repo-test@example.com";
const otherUserEmail = "itin-repo-test-other@example.com";

let userId: string;
let otherUserId: string;
let poiIds: string[];
let otherUserMarkerId: string;

async function makePoi(id: string, lat: number, lng: number) {
  await prisma.poi.create({
    data: {
      id,
      regionId,
      name: id,
      nameByLanguage: { ru: id, en: id, ja: id },
      lat,
      lng,
      description: "",
      rating: 0,
      category: "urban",
      tags: [],
      seasons: [],
      photoScore: 0,
      mustVisit: true,
      bestTime: [],
      difficulty: "easy",
      durationMinutes: 30,
      importance: 1
    }
  });
}

beforeAll(async () => {
  await prisma.country.create({ data: { id: countryId, name: "Itin Testland", nameByLanguage: { ru: "", en: "", ja: "" } } });
  await prisma.area.create({ data: { id: areaId, countryId, name: "Itin Test Area", nameByLanguage: { ru: "", en: "", ja: "" } } });
  await prisma.region.create({
    data: {
      id: regionId,
      areaId,
      name: "Itin Test Region",
      nameByLanguage: { ru: "", en: "", ja: "" },
      centerLat: 34.6937,
      centerLng: 135.5023,
      defaultZoom: 12,
      bounds: { sw: { lat: 34.6, lng: 135.4 }, ne: { lat: 34.8, lng: 135.6 } },
      timezoneOffsetHours: 9,
      sealCharacter: "試"
    }
  });

  await makePoi("itin-poi-1", 34.6937, 135.5023);
  await makePoi("itin-poi-2", 34.694, 135.5026);
  await makePoi("itin-poi-3", 34.6945, 135.503);
  poiIds = ["itin-poi-1", "itin-poi-2", "itin-poi-3"];

  const user = await prisma.user.create({ data: { email: userEmail, passwordHash: "test-hash" } });
  userId = user.id;
  const otherUser = await prisma.user.create({ data: { email: otherUserEmail, passwordHash: "test-hash" } });
  otherUserId = otherUser.id;

  const otherMarker = await prisma.customMarker.create({ data: { userId: otherUserId, lat: 34.6937, lng: 135.5023, color: "#000000" } });
  otherUserMarkerId = otherMarker.id;
});

afterEach(async () => {
  await prisma.itinerary.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
});

afterAll(async () => {
  await prisma.customMarker.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.poi.deleteMany({ where: { regionId } });
  await prisma.region.delete({ where: { id: regionId } });
  await prisma.area.delete({ where: { id: areaId } });
  await prisma.country.delete({ where: { id: countryId } });
  await prisma.$disconnect();
});

describe("createItinerary / listItineraries / deleteItinerary", () => {
  it("creates an itinerary with default title and lists it", async () => {
    const created = await createItinerary(userId);
    expect(created.title).toBe("Мой маршрут");
    expect(created.stops).toEqual([]);

    const list = await listItineraries(userId);
    expect(list.map((i) => i.id)).toContain(created.id);
  });

  it("accepts a custom title", async () => {
    const created = await createItinerary(userId, "Osaka trip");
    expect(created.title).toBe("Osaka trip");
  });

  it("throws ItineraryLimitError past the per-user limit", async () => {
    await createItinerary(userId);
    await createItinerary(userId);
    await createItinerary(userId);
    await expect(createItinerary(userId)).rejects.toBeInstanceOf(ItineraryLimitError);
  });

  it("refuses to delete an itinerary owned by another user", async () => {
    const created = await createItinerary(userId);
    expect(await deleteItinerary(otherUserId, created.id)).toBe(false);
    expect(await listItineraries(userId)).toHaveLength(1);
  });

  it("deletes an itinerary owned by the caller", async () => {
    const created = await createItinerary(userId);
    expect(await deleteItinerary(userId, created.id)).toBe(true);
    expect(await listItineraries(userId)).toHaveLength(0);
  });
});

describe("addStop / addStops", () => {
  it("adds a single stop and is idempotent on repeat calls", async () => {
    const created = await createItinerary(userId);
    await addStop(userId, created.id, poiIds[0]);
    const again = await addStop(userId, created.id, poiIds[0]);
    expect(again?.stops).toHaveLength(1);
    expect(again?.stops[0].point).toMatchObject({ kind: "poi", poi: { id: poiIds[0] } });
  });

  it("returns null for an itinerary that does not belong to the caller", async () => {
    const created = await createItinerary(userId);
    expect(await addStop(otherUserId, created.id, poiIds[0])).toBeNull();
  });

  it("bulk-adds only the POIs not already present", async () => {
    const created = await createItinerary(userId);
    await addStop(userId, created.id, poiIds[0]);
    const result = await addStops(userId, created.id, poiIds);
    expect(result?.stops.map((s) => (s.point.kind === "poi" ? s.point.poi.id : null)).sort()).toEqual([...poiIds].sort());
  });
});

describe("addMarkerStop", () => {
  it("adds a marker the caller owns", async () => {
    const marker = await prisma.customMarker.create({ data: { userId, lat: 34.6937, lng: 135.5023, color: "#ff0000" } });
    const created = await createItinerary(userId);
    const result = await addMarkerStop(userId, created.id, marker.id);
    expect(result?.stops[0].point).toMatchObject({ kind: "marker", marker: { id: marker.id } });
  });

  it("refuses a marker owned by a different user", async () => {
    const created = await createItinerary(userId);
    expect(await addMarkerStop(userId, created.id, otherUserMarkerId)).toBeNull();
  });
});

describe("clearStops / removeStopById", () => {
  it("clears all stops and days and resets the title", async () => {
    const created = await createItinerary(userId, "Custom title");
    await addStops(userId, created.id, poiIds);
    const cleared = await clearStops(userId, created.id);
    expect(cleared?.stops).toEqual([]);
    expect(cleared?.days).toEqual([]);
    expect(cleared?.title).toBe("Мой маршрут");
  });

  it("removes a single stop by id", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const stopId = withStops!.stops[0].id;
    const after = await removeStopById(userId, created.id, stopId);
    expect(after?.stops.map((s) => s.id)).not.toContain(stopId);
    expect(after?.stops).toHaveLength(poiIds.length - 1);
  });
});

describe("reorderDayStops", () => {
  it("applies a valid new order for the day", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const originalOrder = withStops!.stops.map((s) => s.id);
    const reversedOrder = [...originalOrder].reverse();

    const reordered = await reorderDayStops(userId, created.id, 1, reversedOrder);
    expect(reordered?.stops.map((s) => s.id)).toEqual(reversedOrder);
  });

  it("rejects an order that doesn't match the day's stop set", async () => {
    const created = await createItinerary(userId);
    await addStops(userId, created.id, poiIds);
    expect(await reorderDayStops(userId, created.id, 1, ["not-a-real-stop-id"])).toBeNull();
  });
});

describe("updateStopById", () => {
  it("moves a stop to a new day and places it at the end of that day", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const stopId = withStops!.stops[0].id;

    const moved = await updateStopById(userId, created.id, stopId, { day: 2 });
    const movedStop = moved?.stops.find((s) => s.id === stopId);
    expect(movedStop?.day).toBe(2);
    expect(movedStop?.position).toBe(0);
  });

  it("sets a duration override", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const stopId = withStops!.stops[0].id;

    const updated = await updateStopById(userId, created.id, stopId, { durationOverrideMinutes: 45 });
    expect(updated?.stops.find((s) => s.id === stopId)?.durationOverrideMinutes).toBe(45);
  });
});

describe("moveStopToDayWithOrder", () => {
  it("moves a stop to a day and applies the given order in one call", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const [first, second, third] = withStops!.stops;

    const result = await moveStopToDayWithOrder(userId, created.id, first.id, 2, [second.id, third.id, first.id]);
    const day1 = result?.stops.filter((s) => s.day === 1) ?? [];
    const day2 = result?.stops.filter((s) => s.day === 2) ?? [];
    expect(day1.map((s) => s.id)).toEqual([second.id, third.id]);
    expect(day2.map((s) => s.id)).toEqual([first.id]);
  });
});

describe("generateItinerary", () => {
  it("replaces existing stops/days with the generated plan", async () => {
    const created = await createItinerary(userId);
    await addStop(userId, created.id, poiIds[0]);

    const allPois = await prisma.poi.findMany({ where: { id: { in: poiIds } } });
    const plan: PlannedDay[] = [
      { pois: [allPois[0] as unknown as PlannedDay["pois"][number], allPois[1] as unknown as PlannedDay["pois"][number]], suggestedTitle: "Day 1 area" },
      { pois: [allPois[2] as unknown as PlannedDay["pois"][number]], suggestedTitle: "Day 2 area" }
    ];

    const result = await generateItinerary(userId, created.id, plan, "Generated trip");
    expect(result?.title).toBe("Generated trip");
    expect(result?.days.map((d) => d.title)).toEqual(["Day 1 area", "Day 2 area"]);
    expect(result?.stops.filter((s) => s.day === 1)).toHaveLength(2);
    expect(result?.stops.filter((s) => s.day === 2)).toHaveLength(1);
  });
});

describe("renameItinerary / updateItineraryStartDate", () => {
  it("renames the itinerary", async () => {
    const created = await createItinerary(userId);
    const renamed = await renameItinerary(userId, created.id, "New name");
    expect(renamed?.title).toBe("New name");
  });

  it("sets and clears the start date", async () => {
    const created = await createItinerary(userId);
    const withDate = await updateItineraryStartDate(userId, created.id, "2026-04-01");
    expect(withDate?.startDate?.startsWith("2026-04-01")).toBe(true);

    const cleared = await updateItineraryStartDate(userId, created.id, null);
    expect(cleared?.startDate).toBeNull();
  });
});

describe("addDay / removeDay / updateDay", () => {
  it("adds a day after the highest existing day", async () => {
    const created = await createItinerary(userId);
    await addStops(userId, created.id, poiIds);
    const withNewDay = await addDay(userId, created.id);
    expect(withNewDay?.days.map((d) => d.day)).toContain(2);
  });

  it("removes a day and its stops", async () => {
    const created = await createItinerary(userId);
    const withStops = await addStops(userId, created.id, poiIds);
    const stopId = withStops!.stops[0].id;
    await updateStopById(userId, created.id, stopId, { day: 2 });

    const afterRemoval = await removeDay(userId, created.id, 2);
    expect(afterRemoval?.stops.some((s) => s.day === 2)).toBe(false);
  });

  it("upserts day metadata like title and lunch settings", async () => {
    const created = await createItinerary(userId);
    const updated = await updateDay(userId, created.id, 1, { title: "Downtown loop", lunchEnabled: true, lunchStartMinutes: 720 });
    const day1 = updated?.days.find((d) => d.day === 1);
    expect(day1).toMatchObject({ title: "Downtown loop", lunchEnabled: true, lunchStartMinutes: 720 });
  });
});

describe("getItineraryByShareToken", () => {
  it("returns the itinerary for a valid share token, filtering out marker stops", async () => {
    const created = await createItinerary(userId);
    await addStop(userId, created.id, poiIds[0]);
    const marker = await prisma.customMarker.create({ data: { userId, lat: 34.6937, lng: 135.5023, color: "#00ff00" } });
    await addMarkerStop(userId, created.id, marker.id);

    const row = await prisma.itinerary.findUniqueOrThrow({ where: { id: created.id }, select: { shareToken: true } });
    const shared = await getItineraryByShareToken(row.shareToken);

    expect(shared?.stops.every((s) => s.point.kind === "poi")).toBe(true);
    expect(shared?.stops).toHaveLength(1);
  });

  it("returns null for an unknown token", async () => {
    expect(await getItineraryByShareToken("not-a-real-token")).toBeNull();
  });
});
