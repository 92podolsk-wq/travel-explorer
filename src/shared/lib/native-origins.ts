export const REMOTE_ORIGIN = "https://wayora.ru";
export const LOCAL_SHELL_URL = "https://localhost/index.html";

// True when running inside the native app, on the bundled local shell origin
// (as opposed to a real wayora.ru page loaded inside the same WebView).
export function isNativeLocalShell(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.Capacitor?.isNativePlatform?.()) &&
    window.location.origin !== REMOTE_ORIGIN
  );
}
