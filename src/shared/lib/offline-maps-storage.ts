const STORAGE_KEY = "travel-explorer-offline-regions";
// Must match TILE_CACHE in public/sw.js
const TILE_CACHE_NAME = "travel-explorer-tiles-v1";

// Downloads can be triggered from the local app-shell (https://localhost) while
// the profile screen reads this back from https://wayora.ru — different origins
// don't share localStorage, but Capacitor's Preferences plugin is bridged natively
// and is visible from any origin loaded inside the same app, so it's used when available.
async function getNativePreferences() {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) {
    return null;
  }
  try {
    const { Preferences } = await import("@capacitor/preferences");
    return Preferences;
  } catch {
    return null;
  }
}

export async function getDownloadedRegionIds(): Promise<string[]> {
  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      const { value } = await prefs.get({ key: STORAGE_KEY });
      return value ? (JSON.parse(value) as string[]) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function markRegionsDownloaded(regionIds: string[]) {
  const ids = new Set(await getDownloadedRegionIds());
  for (const id of regionIds) ids.add(id);
  const serialized = JSON.stringify([...ids]);

  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      await prefs.set({ key: STORAGE_KEY, value: serialized });
      return;
    } catch {
      // fall through to localStorage
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // ignore storage failures
  }
}

export async function areRegionsDownloaded(regionIds: string[]): Promise<boolean> {
  if (regionIds.length === 0) return false;
  const downloaded = new Set(await getDownloadedRegionIds());
  return regionIds.every((id) => downloaded.has(id));
}

export async function clearDownloadedMaps() {
  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      await prefs.remove({ key: STORAGE_KEY });
    } catch {
      // ignore
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (typeof caches !== "undefined") {
    await caches.delete(TILE_CACHE_NAME);
  }
}
