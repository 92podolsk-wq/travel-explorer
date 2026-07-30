const EVENT_NAME = "travel-explorer-offline-toast";

export function showOfflineToast() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeOfflineToast(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
