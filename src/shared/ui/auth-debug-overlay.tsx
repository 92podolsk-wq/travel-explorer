"use client";

// TEMP-DIAGNOSTIC: shows exactly what the auth-hydration flow is doing,
// directly on screen (no devtools needed) — for tracking down the blank
// Route/Saved/Profile issue. Remove this file + its mount in layout.tsx
// once resolved.
import { useState } from "react";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";

// Bumped by hand on every deploy so a screenshot can confirm whether the
// device is actually running this build, or still serving a stale cached one.
const BUILD_TAG = "2026-08-02c";

export function AuthDebugOverlay() {
  const isNative = useIsNativeApp();
  const log = useExplorerStore((state) => state.authDebugLog);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const [collapsed, setCollapsed] = useState(false);

  if (!isNative) {
    return null;
  }

  return (
    <div
      className="fixed left-1 top-1 z-[999] max-h-48 max-w-[95vw] overflow-y-auto rounded bg-black/85 p-2 font-mono text-[9px] leading-tight text-lime-300 shadow-lg"
      style={{ marginTop: "env(safe-area-inset-top)" }}
    >
      <button type="button" onClick={() => setCollapsed((v) => !v)} className="mb-1 block font-bold text-white">
        AUTH DEBUG [{authStatus}] build:{BUILD_TAG} {collapsed ? "▸" : "▾"}
      </button>
      {!collapsed && (
        <>
          {log.length === 0 && <div>(no log yet)</div>}
          {log.map((entry, i) => (
            <div key={i}>{entry}</div>
          ))}
        </>
      )}
    </div>
  );
}
