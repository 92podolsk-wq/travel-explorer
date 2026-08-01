"use client";

import { useSyncExternalStore } from "react";
import type { AccountTabId } from "./account-tab-navigation";

// Which screen the native app-shell (a single static bundle, no real Next.js
// routing available at https://localhost) is currently showing. Map and
// MobileAppTabBar both need to read AND react to this, so it's a small
// external store (useSyncExternalStore) rather than a fire-and-forget event.
export type ShellScreen = "map" | "account";

type ShellNavState = {
  screen: ShellScreen;
  accountTab: AccountTabId;
};

let state: ShellNavState = { screen: "map", accountTab: "route" };
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

export function navigateShell(screen: ShellScreen, tab?: AccountTabId) {
  state = { screen, accountTab: tab ?? state.accountTab };
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useShellNavigation() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
