const STORAGE_KEY = "travel-explorer-device-token";

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
      const { value } = await prefs.get({ key: STORAGE_KEY });
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
      await prefs.set({ key: STORAGE_KEY, value: token });
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
}
