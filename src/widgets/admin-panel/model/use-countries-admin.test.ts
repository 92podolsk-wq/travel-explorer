// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCountriesAdmin } from "./use-countries-admin";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

describe("useCountriesAdmin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("loads countries from the API", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse([{ id: "c1", name: "Japan" }]));
    const { result } = renderHook(() => useCountriesAdmin(vi.fn()));

    await act(async () => {
      await result.current.load();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/countries");
    expect(result.current.countries).toEqual([{ id: "c1", name: "Japan" }]);
  });

  it("creates a country, reloads the list, and selects it for editing", async () => {
    const setSelection = vi.fn();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: "new-id", name: "Japan" }))
      .mockResolvedValueOnce(jsonResponse([{ id: "new-id", name: "Japan" }]));

    const { result } = renderHook(() => useCountriesAdmin(setSelection));

    await act(async () => {
      await result.current.handleCreate({ name: "Japan" } as never);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/countries",
      expect.objectContaining({ method: "POST" })
    );
    expect(setSelection).toHaveBeenCalledWith({ mode: "edit", id: "new-id" });
    expect(result.current.countries).toEqual([{ id: "new-id", name: "Japan" }]);
  });

  it("surfaces a generic error message when create fails", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, false));
    const { result } = renderHook(() => useCountriesAdmin(vi.fn()));

    await act(async () => {
      await result.current.handleCreate({ name: "Japan" } as never);
    });

    await waitFor(() => expect(result.current.error).toBe("Не удалось создать страну."));
  });

  it("does nothing when the user cancels the delete confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    global.fetch = vi.fn();

    const { result } = renderHook(() => useCountriesAdmin(vi.fn()));
    await act(async () => {
      await result.current.handleDelete({ id: "c1", name: "Japan" } as never);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("deletes a country, resets the selection, and reloads after confirming", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const setSelection = vi.fn();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse([]));

    const { result } = renderHook(() => useCountriesAdmin(setSelection));
    await act(async () => {
      await result.current.handleDelete({ id: "c1", name: "Japan" } as never);
    });

    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/countries/c1", { method: "DELETE" });
    expect(setSelection).toHaveBeenCalledWith({ mode: "empty" });
  });

  it("surfaces the server error message on a failed delete", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ error: "В стране есть регионы" }, false));

    const { result } = renderHook(() => useCountriesAdmin(vi.fn()));
    await act(async () => {
      await result.current.handleDelete({ id: "c1", name: "Japan" } as never);
    });

    await waitFor(() => expect(result.current.error).toBe("В стране есть регионы"));
  });
});
