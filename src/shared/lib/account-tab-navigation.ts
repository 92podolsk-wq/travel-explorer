const EVENT_NAME = "travel-explorer-account-tab-change";

export type AccountTabId = "route" | "saved" | "history" | "profile";

export function emitAccountTabChange(tab: AccountTabId) {
  window.dispatchEvent(new CustomEvent<AccountTabId>(EVENT_NAME, { detail: tab }));
}

export function subscribeAccountTabChange(callback: (tab: AccountTabId) => void) {
  function handler(event: Event) {
    callback((event as CustomEvent<AccountTabId>).detail);
  }
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
