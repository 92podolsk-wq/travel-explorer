const STORAGE_KEY = "travel-explorer-offline-regions";
// Must match TILE_CACHE in public/sw.js
const TILE_CACHE_NAME = "travel-explorer-tiles-v1";

export function getDownloadedRegionIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markRegionsDownloaded(regionIds: string[]) {
  try {
    const ids = new Set(getDownloadedRegionIds());
    for (const id of regionIds) ids.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore storage failures
  }
}

export function areRegionsDownloaded(regionIds: string[]): boolean {
  if (regionIds.length === 0) return false;
  const downloaded = new Set(getDownloadedRegionIds());
  return regionIds.every((id) => downloaded.has(id));
}

export async function clearDownloadedMaps() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (typeof caches !== "undefined") {
    await caches.delete(TILE_CACHE_NAME);
  }
}
