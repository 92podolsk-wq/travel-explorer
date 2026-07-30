const STORAGE_KEY = "travel-explorer-push-token";
const DISABLED_KEY = "travel-explorer-push-disabled";

export function savePushToken(token: string) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}

export function readPushToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPushToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isPushDisabledByUser(): boolean {
  try {
    return localStorage.getItem(DISABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPushDisabledByUser(disabled: boolean) {
  try {
    if (disabled) {
      localStorage.setItem(DISABLED_KEY, "1");
    } else {
      localStorage.removeItem(DISABLED_KEY);
    }
  } catch {
    // ignore
  }
}
