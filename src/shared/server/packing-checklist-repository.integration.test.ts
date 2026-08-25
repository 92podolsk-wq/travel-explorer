import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import { getOrCreateChecklist, updateChecklist } from "./packing-checklist-repository";

const userEmail = "checklist-repo-test@example.com";

let userId: string;

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
  it("seeds default packing + document items, leaving shopping/departure empty", async () => {
    const checklist = await getOrCreateChecklist(userId);

    expect(checklist.tripName).toBeNull();
    expect(checklist.tripStartDate).toBeNull();
    expect(checklist.tripEndDate).toBeNull();
    expect(checklist.packingItems.length).toBeGreaterThan(0);
    expect(checklist.documentItems.length).toBeGreaterThan(0);
    expect(checklist.documentItems.map((item) => item.label)).toContain("Паспорт / документы");
    expect(checklist.packingItems.map((item) => item.label)).not.toContain("Паспорт / документы");
    expect(checklist.shoppingItems).toEqual([]);
    expect(checklist.departureItems).toEqual([]);
  });

  it("is idempotent — a second call returns the same row instead of reseeding", async () => {
    const first = await getOrCreateChecklist(userId);
    await updateChecklist(userId, { packingItems: [] });

    const second = await getOrCreateChecklist(userId);

    expect(second.packingItems).toEqual([]);
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

  it("patches the new documentItems/departureItems arrays independently of packing/shopping", async () => {
    await getOrCreateChecklist(userId);

    const updated = await updateChecklist(userId, {
      documentItems: [{ id: "doc-1", label: "Паспорт", checked: false }],
      departureItems: [{ id: "dep-1", label: "Выключить утюг", checked: true }]
    });

    expect(updated.documentItems).toEqual([{ id: "doc-1", label: "Паспорт", checked: false }]);
    expect(updated.departureItems).toEqual([{ id: "dep-1", label: "Выключить утюг", checked: true }]);
    expect(updated.shoppingItems).toEqual([]);
  });
});
