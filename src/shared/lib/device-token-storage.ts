import { withTimeout } from "./with-timeout";

const STORAGE_KEY = "travel-explorer-device-token";
// Native plugin bridge calls are local (no network) and should be near-
// instant — this is purely a safety net against a hung bridge call.
const PREFS_TIMEOUT_MS = 3000;

// The device token authenticates API calls made from the local app-shell
// (https://localhost) origin, which can't use the httpOnly session cookie set
// on https://wayora.ru. Mirrors offline-maps-storage.ts's storage pattern:
// Capacitor Preferences (native, visible from any origin in the app) with a
// localStorage fallback for the plain-web/PWA case.
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

export async function getDeviceToken(): Promise<string | null> {
  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      const { value } = await withTimeout(prefs.get({ key: STORAGE_KEY }), PREFS_TIMEOUT_MS, { value: null });
      return value ?? null;
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveDeviceToken(token: string) {
  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      await withTimeout(prefs.set({ key: STORAGE_KEY, value: token }), PREFS_TIMEOUT_MS, undefined);
      return;
    } catch {
      // fall through to localStorage
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore storage failures
  }
}

export async function clearDeviceToken() {
  const prefs = await getNativePreferences();
  if (prefs) {
    try {
      await withTimeout(prefs.remove({ key: STORAGE_KEY }), PREFS_TIMEOUT_MS, undefined);
    } catch {
      // ignore
    }
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
