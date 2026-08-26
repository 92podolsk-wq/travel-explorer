// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useLocationsAdmin } from "./use-locations-admin";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

const poi = {
  id: "p1",
  regionId: "r1",
  name: "Kiyomizu-dera",
  nameByLanguage: {},
  coordinates: { lat: 1, lng: 2 },
  description: "",
  descriptionByLanguage: {},
  rating: 5,
  photos: [],
  category: "temple",
  tags: [],
  seasons: [],
  photoScore: 1,
  difficulty: "easy",
  durationMinutes: 60,
  importance: 1,
  status: "published"
} as never;

describe("useLocationsAdmin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("duplicates a poi as a draft with a '(копия)' suffix", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "p2", name: "Kiyomizu-dera (копия)" }))
      .mockResolvedValueOnce(jsonResponse([{ id: "p2" }]));
    const setSelection = vi.fn();

    const { result } = renderHook(() => useLocationsAdmin(setSelection));
    await act(async () => {
      await result.current.handleDuplicate(poi);
    });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body as string);
    expect(body.name).toBe("Kiyomizu-dera (копия)");
    expect(body.status).toBe("draft");
    expect(setSelection).toHaveBeenCalledWith({ mode: "edit", id: "p2" });
  });

  it("toggles a single poi's selection on and off", () => {
    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));

    act(() => result.current.toggleSelected("p1"));
    expect(result.current.selectedIds.has("p1")).toBe(true);

    act(() => result.current.toggleSelected("p1"));
    expect(result.current.selectedIds.has("p1")).toBe(false);
  });

  it("toggleAllSelected selects all when not all are selected, and clears when they are", () => {
    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));

    act(() => result.current.toggleAllSelected(["p1", "p2"]));
    expect([...result.current.selectedIds]).toEqual(["p1", "p2"]);

    act(() => result.current.toggleAllSelected(["p1", "p2"]));
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("bulk-sets status only for the selected pois and clears selection afterward", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}));
    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));

    // Seed pois via load() so handleBulkSetStatus has something to filter.
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      jsonResponse([
        { id: "p1", regionId: "r1" },
        { id: "p2", regionId: "r1" }
      ])
    );
    await act(async () => {
      await result.current.load();
    });
    act(() => result.current.toggleSelected("p1"));

    await act(async () => {
      await result.current.handleBulkSetStatus("published");
    });

    const putCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(([, opts]) => opts?.method === "PUT");
    expect(putCalls).toHaveLength(1);
    expect(putCalls[0][0]).toBe("/api/pois/p1");
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("does not delete in bulk when the user cancels the confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    global.fetch = vi.fn();

    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));
    act(() => result.current.toggleSelected("p1"));

    await act(async () => {
      await result.current.handleBulkDelete();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("opens the trash and loads its contents", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse([{ id: "p1", name: "Old place" }]));
    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));

    await act(async () => {
      await result.current.handleOpenTrash();
    });

    expect(result.current.isTrashOpen).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith("/api/admin/locations-trash");
    await waitFor(() => expect(result.current.trash).toEqual([{ id: "p1", name: "Old place" }]));
  });

  it("restores a poi from the trash and reloads both the trash and the poi list", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));

    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));
    await act(async () => {
      await result.current.handleRestore("p1");
    });

    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/admin/locations-trash/p1", { method: "POST" });
  });

  it("changes the city for the selected pois in bulk and clears the target", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: "p1", regionId: "r1" }]))
      .mockResolvedValue(jsonResponse({}));

    const { result } = renderHook(() => useLocationsAdmin(vi.fn()));
    await act(async () => {
      await result.current.load();
    });
    act(() => {
      result.current.toggleSelected("p1");
      result.current.setBulkCityTarget("r2");
    });
    await waitFor(() => expect(result.current.bulkCityTarget).toBe("r2"));

    await act(async () => {
      await result.current.handleBulkChangeCity();
    });

    expect(result.current.bulkCityTarget).toBe("");
  });
});
