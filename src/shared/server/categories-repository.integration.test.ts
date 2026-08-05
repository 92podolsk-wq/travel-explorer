import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import type { CategoryInput } from "@/entities/category/model/types";
import { prisma } from "./prisma-client";
import { createCategory, deleteCategory, readCategories, updateCategory } from "./categories-repository";

const countryId = "cat-test-country";
const areaId = "cat-test-area";
const regionId = "cat-test-region";

function makeCategoryInput(overrides: Partial<CategoryInput> = {}): CategoryInput {
  return {
    name: "Temples",
    nameByLanguage: { ru: "Храмы", en: "Temples", ja: "寺院" },
    icon: "torii-gate",
    color: "#a8567a",
    isHidden: false,
    ...overrides
  };
}

beforeAll(async () => {
  await prisma.country.create({ data: { id: countryId, name: "Cat Testland", nameByLanguage: { ru: "", en: "", ja: "" } } });
  await prisma.area.create({ data: { id: areaId, countryId, name: "Cat Test Area", nameByLanguage: { ru: "", en: "", ja: "" } } });
  await prisma.region.create({
    data: {
      id: regionId,
      areaId,
      name: "Cat Test Region",
      nameByLanguage: { ru: "", en: "", ja: "" },
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
  await prisma.category.deleteMany({ where: { OR: [{ id: "temples" }, { id: { startsWith: "temples-" } }, { id: "renamed-once" }] } });
});

afterAll(async () => {
  await prisma.region.delete({ where: { id: regionId } });
  await prisma.area.delete({ where: { id: areaId } });
  await prisma.country.delete({ where: { id: countryId } });
  await prisma.$disconnect();
});

describe("createCategory / readCategories", () => {
  it("creates a category with an auto-generated slug id and increasing position", async () => {
    const first = await createCategory(makeCategoryInput({ name: "Temples" }));
    expect(first.id).toBe("temples");

    const second = await createCategory(makeCategoryInput({ name: "Temples" }));
    expect(second.id).toBe("temples-2");
    expect(second.position).toBeGreaterThan(first.position);

    const all = await readCategories();
    expect(all.map((c) => c.id)).toEqual(expect.arrayContaining(["temples", "temples-2"]));
  });
});

describe("updateCategory", () => {
  it("updates fields when the category is not renamed", async () => {
    const created = await createCategory(makeCategoryInput({ name: "Temples" }));
    const result = await updateCategory(created.id, makeCategoryInput({ name: "Temples", isHidden: true }));
    expect(result).toMatchObject({ success: true });
    expect(result.category?.isHidden).toBe(true);
  });

  it("returns not-found for a category that does not exist", async () => {
    const result = await updateCategory("does-not-exist", makeCategoryInput());
    expect(result).toEqual({ success: false, reason: "not-found" });
  });

  it("blocks a rename while POIs still reference the category id", async () => {
    const created = await createCategory(makeCategoryInput({ name: "Temples" }));
    await prisma.poi.create({
      data: {
        id: "cat-test-poi",
        regionId,
        name: "Test Temple",
        nameByLanguage: { ru: "", en: "", ja: "" },
        lat: 34.6937,
        lng: 135.5023,
        description: "",
        rating: 0,
        category: created.id,
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

    const result = await updateCategory(created.id, makeCategoryInput({ name: "Renamed" }));
    expect(result).toMatchObject({ success: false, reason: "in-use", placeCount: 1 });
  });
});

describe("deleteCategory", () => {
  it("deletes a category with no POIs referencing it", async () => {
    const created = await createCategory(makeCategoryInput({ name: "Temples" }));
    expect(await deleteCategory(created.id)).toEqual({ success: true });
    expect((await readCategories()).map((c) => c.id)).not.toContain(created.id);
  });

  it("returns not-found for a category that does not exist", async () => {
    expect(await deleteCategory("does-not-exist")).toEqual({ success: false, reason: "not-found" });
  });

  it("refuses to delete a category still referenced by a POI", async () => {
    const created = await createCategory(makeCategoryInput({ name: "Temples" }));
    await prisma.poi.create({
      data: {
        id: "cat-test-poi-2",
        regionId,
        name: "Test Temple 2",
        nameByLanguage: { ru: "", en: "", ja: "" },
        lat: 34.6937,
        lng: 135.5023,
        description: "",
        rating: 0,
        category: created.id,
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

    const result = await deleteCategory(created.id);
    expect(result).toMatchObject({ success: false, reason: "in-use", placeCount: 1 });
  });
});
