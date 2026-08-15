import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { PoiInput } from "@/entities/poi/model/types";
import { prisma } from "./prisma-client";
import {
  createPoi,
  permanentlyDeletePoi,
  readDeletedPois,
  readPois,
  readPublishedPois,
  restorePoi,
  softDeletePoi,
  updatePoi
} from "./pois-repository";

const countryId = "test-country";
const areaId = "test-area";
const regionId = "test-region";

function makePoiInput(overrides: Partial<PoiInput> = {}): PoiInput {
  return {
    regionId,
    name: "Test Shrine",
    nameByLanguage: { ru: "Тестовый храм", en: "Test Shrine" },
    coordinates: { lat: 34.6937, lng: 135.5023 },
    description: "A shrine used only in tests.",
    descriptionByLanguage: { ru: "", en: "A shrine used only in tests." },
    rating: 0,
    photos: [],
    category: "urban",
    tags: [],
    seasons: [],
    photoScore: 0,
    mustVisit: true,
    difficulty: "easy",
    durationMinutes: 30,
    importance: 1,
    status: "published",
    ...overrides
  };
}

beforeAll(async () => {
  await prisma.country.create({ data: { id: countryId, name: "Testland", nameByLanguage: { ru: "Тестландия", en: "Testland", ja: "テストランド" } } });
  await prisma.area.create({ data: { id: areaId, countryId, name: "Test Area", nameByLanguage: { ru: "Тест", en: "Test Area", ja: "テストエリア" } } });
  await prisma.region.create({
    data: {
      id: regionId,
      areaId,
      name: "Test Region",
      nameByLanguage: { ru: "Тестовый регион", en: "Test Region", ja: "テスト地域" },
      centerLat: 34.6937,
      centerLng: 135.5023,
      defaultZoom: 12,
      bounds: { sw: { lat: 34.6, lng: 135.4 }, ne: { lat: 34.8, lng: 135.6 } },
      timezoneOffsetHours: 9,
      sealCharacter: "試"
    }
  });
});

afterEach(async () => {
  await prisma.poi.deleteMany({ where: { regionId } });
});

afterAll(async () => {
  await prisma.region.delete({ where: { id: regionId } });
  await prisma.area.delete({ where: { id: areaId } });
  await prisma.country.delete({ where: { id: countryId } });
  await prisma.$disconnect();
});

describe("createPoi / readPois / readPublishedPois", () => {
  it("creates a POI and makes it visible in both read helpers", async () => {
    const created = await createPoi(makePoiInput({ id: "test-shrine" }));
    expect(created.id).toBe("test-shrine");
    expect(created.favoritesCount).toBe(0);

    const all = await readPois();
    const published = await readPublishedPois();
    expect(all.map((p) => p.id)).toContain("test-shrine");
    expect(published.map((p) => p.id)).toContain("test-shrine");
  });

  it("excludes draft POIs from readPublishedPois but includes them in readPois", async () => {
    await createPoi(makePoiInput({ id: "test-draft-shrine", status: "draft" }));

    const all = await readPois();
    const published = await readPublishedPois();
    expect(all.map((p) => p.id)).toContain("test-draft-shrine");
    expect(published.map((p) => p.id)).not.toContain("test-draft-shrine");
  });

  it("generates a unique slug id when none is supplied", async () => {
    const created = await createPoi(makePoiInput({ name: "Dotonbori Canal" }));
    expect(created.id).toBe("dotonbori-canal");
  });
});

describe("updatePoi", () => {
  it("returns null for a POI that does not exist", async () => {
    expect(await updatePoi("does-not-exist", makePoiInput())).toBeNull();
  });

  it("updates fields on an existing POI", async () => {
    await createPoi(makePoiInput({ id: "test-shrine" }));
    const updated = await updatePoi("test-shrine", makePoiInput({ id: "test-shrine", name: "Renamed Shrine", importance: 9 }));
    expect(updated?.name).toBe("Renamed Shrine");
    expect(updated?.importance).toBe(9);
  });
});

describe("soft delete / trash / restore", () => {
  it("moves a POI out of both read helpers on soft delete and into the trash list", async () => {
    await createPoi(makePoiInput({ id: "test-shrine" }));

    expect(await softDeletePoi("test-shrine")).toBe(true);

    const all = await readPois();
    const published = await readPublishedPois();
    expect(all.map((p) => p.id)).not.toContain("test-shrine");
    expect(published.map((p) => p.id)).not.toContain("test-shrine");

    const trash = await readDeletedPois();
    expect(trash.map((p) => p.id)).toContain("test-shrine");
  });

  it("returns false when soft-deleting a POI that does not exist", async () => {
    expect(await softDeletePoi("does-not-exist")).toBe(false);
  });

  it("brings a trashed POI back via restorePoi", async () => {
    await createPoi(makePoiInput({ id: "test-shrine" }));
    await softDeletePoi("test-shrine");

    expect(await restorePoi("test-shrine")).toBe(true);

    const all = await readPois();
    const trash = await readDeletedPois();
    expect(all.map((p) => p.id)).toContain("test-shrine");
    expect(trash.map((p) => p.id)).not.toContain("test-shrine");
  });

  it("permanently removes a POI so it no longer appears anywhere, including the trash", async () => {
    await createPoi(makePoiInput({ id: "test-shrine" }));
    await softDeletePoi("test-shrine");

    expect(await permanentlyDeletePoi("test-shrine")).toBe(true);

    const trash = await readDeletedPois();
    expect(trash.map((p) => p.id)).not.toContain("test-shrine");
  });

  it("returns false when permanently deleting a POI that does not exist", async () => {
    expect(await permanentlyDeletePoi("does-not-exist")).toBe(false);
  });
});
