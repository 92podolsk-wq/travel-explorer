"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { subscribeNavigationTransition } from "@/shared/lib/navigation-transition";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";

export function NavigationTransitionOverlay() {
  const isNative = useIsNativeApp();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isNative) {
      return;
    }
    return subscribeNavigationTransition(() => setVisible(true));
  }, [isNative]);

  if (!isNative || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-muted">
      <Image src="/icon.png" alt="Wayora" width={56} height={56} className="rounded-2xl" priority />
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
    </div>
  );
}
