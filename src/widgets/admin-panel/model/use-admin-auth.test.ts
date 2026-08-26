// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useAdminAuth } from "./use-admin-auth";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response;
}

describe("useAdminAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("moves to the login view when the session check reports not authenticated", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue(jsonResponse({ authenticated: false, admin: null }));

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));

    await waitFor(() => expect(result.current.authView.mode).toBe("login"));
    expect(loadAllAdminData).not.toHaveBeenCalled();
  });

  it("loads all admin data and moves to ready when already authenticated", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi.fn().mockResolvedValue(
      jsonResponse({ authenticated: true, admin: { name: "Denis", email: "d@example.com" } })
    );

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));

    await waitFor(() => expect(result.current.authView.mode).toBe("ready"));
    expect(loadAllAdminData).toHaveBeenCalledTimes(1);
    expect(result.current.currentAdmin).toEqual({ name: "Denis", email: "d@example.com" });
  });

  it("shows the error view when the session check fails outright", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi.fn().mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));

    await waitFor(() => expect(result.current.authView.mode).toBe("error"));
  });

  it("logs in successfully and loads admin data", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ authenticated: false, admin: null }))
      .mockResolvedValueOnce(jsonResponse({ admin: { name: "Denis", email: "d@example.com" } }));

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));
    await waitFor(() => expect(result.current.authView.mode).toBe("login"));

    act(() => {
      result.current.setEmail("d@example.com");
      result.current.setPassword("hunter2");
    });
    await waitFor(() => expect(result.current.password).toBe("hunter2"));

    await act(async () => {
      await result.current.handleLogin({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.authView.mode).toBe("ready");
    expect(result.current.currentAdmin).toEqual({ name: "Denis", email: "d@example.com" });
    expect(result.current.password).toBe("");
    expect(loadAllAdminData).toHaveBeenCalledTimes(1);
  });

  it("surfaces a login error on bad credentials without loading admin data", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ authenticated: false, admin: null }))
      .mockResolvedValueOnce(jsonResponse({}, false));

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));
    await waitFor(() => expect(result.current.authView.mode).toBe("login"));

    await act(async () => {
      await result.current.handleLogin({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.loginError).not.toBeNull();
    expect(loadAllAdminData).not.toHaveBeenCalled();
  });

  it("logs out and returns to the login view", async () => {
    const loadAllAdminData = vi.fn().mockResolvedValue(undefined);
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ authenticated: true, admin: { name: "Denis", email: "d@example.com" } }))
      .mockResolvedValueOnce(jsonResponse({}));

    const { result } = renderHook(() => useAdminAuth(loadAllAdminData));
    await waitFor(() => expect(result.current.authView.mode).toBe("ready"));

    await act(async () => {
      await result.current.handleLogout();
    });

    expect(result.current.authView.mode).toBe("login");
    expect(result.current.currentAdmin).toBeNull();
  });
});
