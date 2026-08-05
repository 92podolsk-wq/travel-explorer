import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma-client";
import { CustomMarkerLimitError, createCustomMarker, deleteCustomMarker, listCustomMarkers } from "./custom-markers-repository";
import { updateSiteSettings, getSiteSettings } from "./site-settings-repository";

const userEmail = "custom-marker-test@example.com";
let userId: string;
let otherUserId: string;

beforeAll(async () => {
  const user = await prisma.user.create({ data: { email: userEmail, passwordHash: "test-hash" } });
  userId = user.id;
  const otherUser = await prisma.user.create({ data: { email: "custom-marker-test-other@example.com", passwordHash: "test-hash" } });
  otherUserId = otherUser.id;
});

afterEach(async () => {
  await prisma.customMarker.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
});

afterAll(async () => {
  await prisma.siteSetting.deleteMany({ where: { id: "singleton" } });
  await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

describe("createCustomMarker / listCustomMarkers", () => {
  it("creates a marker and lists it back for that user", async () => {
    const created = await createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a", label: "Hidden spot" });
    expect(created.label).toBe("Hidden spot");

    const list = await listCustomMarkers(userId);
    expect(list.map((m) => m.id)).toContain(created.id);
  });

  it("trims the label and defaults to an empty string when omitted", async () => {
    const created = await createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a", label: "  spaced  " });
    expect(created.label).toBe("spaced");

    const withoutLabel = await createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" });
    expect(withoutLabel.label).toBe("");
  });

  it("does not include another user's markers", async () => {
    await createCustomMarker(otherUserId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" });
    const list = await listCustomMarkers(userId);
    expect(list).toHaveLength(0);
  });

  it("throws CustomMarkerLimitError once the per-user limit is reached", async () => {
    await updateSiteSettings({ ...(await getSiteSettings()), maxCustomMarkersPerUser: 1 });

    await createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" });
    await expect(createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" })).rejects.toBeInstanceOf(
      CustomMarkerLimitError
    );

    await updateSiteSettings({ ...(await getSiteSettings()), maxCustomMarkersPerUser: 200 });
  });
});

describe("deleteCustomMarker", () => {
  it("deletes a marker owned by the caller", async () => {
    const created = await createCustomMarker(userId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" });
    expect(await deleteCustomMarker(userId, created.id)).toBe(true);
    expect(await listCustomMarkers(userId)).toHaveLength(0);
  });

  it("refuses to delete a marker owned by another user", async () => {
    const created = await createCustomMarker(otherUserId, { lat: 34.6937, lng: 135.5023, color: "#e24b4a" });
    expect(await deleteCustomMarker(userId, created.id)).toBe(false);
    expect(await listCustomMarkers(otherUserId)).toHaveLength(1);
  });

  it("returns false for a marker that does not exist", async () => {
    expect(await deleteCustomMarker(userId, "does-not-exist")).toBe(false);
  });
});
