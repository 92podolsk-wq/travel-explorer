// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useUsersAdmin } from "./use-users-admin";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

describe("useUsersAdmin", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("toggles hidden-category access and reloads", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse([]));
    const { result } = renderHook(() => useUsersAdmin());

    const user = { id: "u1", email: "a@b.com", canAccessHiddenCategories: false, isBlocked: false } as never;
    await act(async () => {
      await result.current.handleToggleHiddenAccess(user);
    });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({ canAccessHiddenCategories: true });
  });

  it("asks for confirmation before blocking a user, and skips the request if declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    global.fetch = vi.fn();

    const { result } = renderHook(() => useUsersAdmin());
    const user = { id: "u1", email: "a@b.com", isBlocked: false } as never;
    await act(async () => {
      await result.current.handleToggleBlock(user);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("blocks the user once confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue(jsonResponse([]));

    const { result } = renderHook(() => useUsersAdmin());
    const user = { id: "u1", email: "a@b.com", isBlocked: false } as never;
    await act(async () => {
      await result.current.handleToggleBlock(user);
    });

    const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(options.body as string)).toEqual({ isBlocked: true });
  });

  it("surfaces an error when the delete request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({}, false));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const { result } = renderHook(() => useUsersAdmin());
    await act(async () => {
      await result.current.handleDelete({ id: "u1", email: "a@b.com" } as never);
    });

    await waitFor(() => expect(result.current.error).toBe("Не удалось удалить пользователя."));
  });
});
