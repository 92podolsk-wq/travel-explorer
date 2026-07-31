const EVENT_NAME = "travel-explorer-navigation-transition";

export function showNavigationTransition() {
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeNavigationTransition(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
