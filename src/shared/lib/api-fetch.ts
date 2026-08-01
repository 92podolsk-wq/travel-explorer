import { REMOTE_ORIGIN, isNativeLocalShell } from "./native-origins";
import { getDeviceToken } from "./device-token-storage";

// fetch() has no built-in timeout — on a stalled mobile connection the
// promise can sit pending forever (neither resolving nor rejecting), which
// left screens stuck on a "loading" state with no way to fail over. Give
// every call a bounded lifetime so it always eventually settles.
const TIMEOUT_MS = 10000;

function timeoutSignal(): AbortSignal | undefined {
  try {
    return AbortSignal.timeout(TIMEOUT_MS);
  } catch {
    return undefined;
  }
}

// Drop-in replacement for fetch() for any call to /api/auth/* or /api/me/*.
// On the website (or once already navigated to a wayora.ru page inside the
// app) it behaves exactly like a bare relative fetch. On the local app-shell
// origin (https://localhost) it rewrites the path to an absolute wayora.ru
// URL and attaches the stored device token as a Bearer header, since that
// origin has no cookie session.
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const signal = init?.signal ?? timeoutSignal();

  if (!isNativeLocalShell()) {
    return fetch(path, { ...init, signal });
  }

  const token = await getDeviceToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(`${REMOTE_ORIGIN}${path}`, { ...init, headers, signal });
}
