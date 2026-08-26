// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useOfflineMapDownload } from "./use-offline-map-download";

vi.mock("@/shared/lib/offline-map-download", () => ({ downloadRegionForOffline: vi.fn() }));
vi.mock("@/shared/lib/offline-maps-storage", () => ({
  areRegionsDownloaded: vi.fn(),
  markRegionsDownloaded: vi.fn()
}));
vi.mock("@/shared/map/map-styles", () => ({ presetMapStyleUrl: vi.fn(() => "https://tiles.example/style.json") }));

import { downloadRegionForOffline } from "@/shared/lib/offline-map-download";
import { areRegionsDownloaded, markRegionsDownloaded } from "@/shared/lib/offline-maps-storage";

const region = { id: "r1", bounds: [[135, 34], [136, 35]] } as never;

describe("useOfflineMapDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts idle and flips to done when the region is already downloaded", async () => {
    (areRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const { result } = renderHook(() => useOfflineMapDownload(["r1"], [region], "openfreemap-bright" as never));

    await waitFor(() => expect(result.current.offlineDownloadState).toBe("done"));
  });

  it("stays idle when the region isn't downloaded yet", async () => {
    (areRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const { result } = renderHook(() => useOfflineMapDownload(["r1"], [region], "openfreemap-bright" as never));

    await waitFor(() => expect(areRegionsDownloaded).toHaveBeenCalled());
    expect(result.current.offlineDownloadState).toBe("idle");
  });

  it("downloads the active region, reports progress, and marks it done", async () => {
    (areRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (downloadRegionForOffline as ReturnType<typeof vi.fn>).mockImplementation(async ({ onProgress }) => {
      onProgress({ loaded: 50, total: 100 });
    });
    (markRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useOfflineMapDownload(["r1"], [region], "openfreemap-bright" as never));
    await waitFor(() => expect(result.current.offlineDownloadState).toBe("idle"));

    await act(async () => {
      await result.current.handleDownloadOfflineMap();
    });

    expect(markRegionsDownloaded).toHaveBeenCalledWith(["r1"]);
    expect(result.current.offlineDownloadState).toBe("done");
  });

  it("marks the state as error when the download throws", async () => {
    (areRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (downloadRegionForOffline as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useOfflineMapDownload(["r1"], [region], "openfreemap-bright" as never));
    await waitFor(() => expect(result.current.offlineDownloadState).toBe("idle"));

    await act(async () => {
      await result.current.handleDownloadOfflineMap();
    });

    expect(result.current.offlineDownloadState).toBe("error");
  });

  it("does nothing when there are no active regions", async () => {
    (areRegionsDownloaded as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const { result } = renderHook(() => useOfflineMapDownload([], [], "openfreemap-bright" as never));
    await waitFor(() => expect(result.current.offlineDownloadState).toBe("idle"));

    await act(async () => {
      await result.current.handleDownloadOfflineMap();
    });

    expect(downloadRegionForOffline).not.toHaveBeenCalled();
  });
});
