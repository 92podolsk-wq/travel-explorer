import { useEffect, useState } from "react";
import type { Region } from "@/entities/region/model/types";
import type { MapStyleId } from "@/entities/site-setting/model/types";
import { downloadRegionForOffline } from "@/shared/lib/offline-map-download";
import { areRegionsDownloaded, markRegionsDownloaded } from "@/shared/lib/offline-maps-storage";
import { presetMapStyleUrl } from "@/shared/map/map-styles";
import { mergeBounds } from "./merge-bounds";

export function useOfflineMapDownload(activeRegionIds: string[], regions: Region[], mapStyleId: MapStyleId) {
  const [offlineDownloadState, setOfflineDownloadState] = useState<"idle" | "downloading" | "done" | "error">("idle");
  const [offlineDownloadProgress, setOfflineDownloadProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    areRegionsDownloaded(activeRegionIds).then((downloaded) => {
      if (!cancelled) setOfflineDownloadState(downloaded ? "done" : "idle");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegionIds.join(",")]);

  async function handleDownloadOfflineMap() {
    const activeRegions = regions.filter((region) => activeRegionIds.includes(region.id));
    const styleUrl = presetMapStyleUrl(mapStyleId);
    if (activeRegions.length === 0 || !styleUrl) {
      return;
    }

    const bounds = activeRegions.length === 1 ? activeRegions[0].bounds : mergeBounds(activeRegions);

    setOfflineDownloadState("downloading");
    setOfflineDownloadProgress(0);

    try {
      await downloadRegionForOffline({
        bounds,
        minZoom: 10,
        maxZoom: 16,
        styleUrl,
        onProgress: ({ loaded, total }) => {
          setOfflineDownloadProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);
        }
      });
      await markRegionsDownloaded(activeRegionIds);
      setOfflineDownloadState("done");
    } catch {
      setOfflineDownloadState("error");
    }
  }

  return { offlineDownloadState, offlineDownloadProgress, handleDownloadOfflineMap };
}
