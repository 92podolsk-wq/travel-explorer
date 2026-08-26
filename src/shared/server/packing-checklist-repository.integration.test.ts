import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import { getOrCreateChecklist, updateChecklist } from "./packing-checklist-repository";
import type { ChecklistCategory } from "@/entities/checklist/model/types";

const userEmail = "checklist-repo-test@example.com";

let userId: string;

function findCategory(categories: ChecklistCategory[], id: string): ChecklistCategory {
  const category = categories.find((c) => c.id === id);
  if (!category) throw new Error(`category ${id} not found`);
  return category;
}

beforeEach(async () => {
  const user = await prisma.user.create({ data: { email: userEmail, username: "checklist_repo_test", passwordHash: "test-hash" } });
  userId = user.id;
});

afterEach(async () => {
  await prisma.packingChecklist.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("getOrCreateChecklist", () => {
  it("seeds default packing + document categories", async () => {
    const checklist = await getOrCreateChecklist(userId);

    expect(checklist.tripName).toBeNull();
    expect(checklist.tripStartDate).toBeNull();
    expect(checklist.tripEndDate).toBeNull();

    const packing = findCategory(checklist.categories, "packing");
    const documents = findCategory(checklist.categories, "documents");
    expect(packing.items.length).toBeGreaterThan(0);
    expect(documents.items.length).toBeGreaterThan(0);
    expect(documents.items.map((item) => item.label)).toContain("Паспорт / документы");
    expect(packing.items.map((item) => item.label)).not.toContain("Паспорт / документы");
  });

  it("is idempotent — a second call returns the same row instead of reseeding", async () => {
    const first = await getOrCreateChecklist(userId);
    await updateChecklist(userId, {
      categories: first.categories.map((c) => (c.id === "packing" ? { ...c, items: [] } : c))
    });

    const second = await getOrCreateChecklist(userId);

    expect(findCategory(second.categories, "packing").items).toEqual([]);
    expect(second.tripStartDate).toBe(first.tripStartDate);
  });
});

describe("updateChecklist", () => {
  it("patches tripName/tripStartDate/tripEndDate independently, leaving omitted fields unchanged", async () => {
    await getOrCreateChecklist(userId);

    const afterName = await updateChecklist(userId, { tripName: "Осака" });
    expect(afterName.tripName).toBe("Осака");
    expect(afterName.tripStartDate).toBeNull();

    const afterDates = await updateChecklist(userId, {
      tripStartDate: "2026-05-12T00:00:00.000Z",
      tripEndDate: "2026-05-19T00:00:00.000Z"
    });
    expect(afterDates.tripName).toBe("Осака");
    expect(afterDates.tripStartDate).toBe("2026-05-12T00:00:00.000Z");
    expect(afterDates.tripEndDate).toBe("2026-05-19T00:00:00.000Z");
  });

  it("clears a date field when patched with null, and leaves it alone when omitted", async () => {
    await getOrCreateChecklist(userId);
    await updateChecklist(userId, { tripStartDate: "2026-05-12T00:00:00.000Z" });

    const afterOmit = await updateChecklist(userId, { tripName: "still here" });
    expect(afterOmit.tripStartDate).toBe("2026-05-12T00:00:00.000Z");

    const afterClear = await updateChecklist(userId, { tripStartDate: null });
    expect(afterClear.tripStartDate).toBeNull();
  });

  it("patches the categories array wholesale, replacing the previous list", async () => {
    await getOrCreateChecklist(userId);

    const updated = await updateChecklist(userId, {
      categories: [
        { id: "documents", title: "Документы", emoji: "📄", items: [{ id: "doc-1", label: "Паспорт", checked: false }] },
        { id: "departure", title: "Перед выездом", emoji: "🏠", items: [{ id: "dep-1", label: "Выключить утюг", checked: true }] }
      ]
    });

    expect(findCategory(updated.categories, "documents").items).toEqual([{ id: "doc-1", label: "Паспорт", checked: false }]);
    expect(findCategory(updated.categories, "departure").items).toEqual([
      { id: "dep-1", label: "Выключить утюг", checked: true }
    ]);
    expect(updated.categories.find((c) => c.id === "packing")).toBeUndefined();
  });
});
