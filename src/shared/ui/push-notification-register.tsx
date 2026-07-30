"use client";

import { useEffect } from "react";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";

export function PushNotificationRegister() {
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isNative) {
      return;
    }

    let isMounted = true;

    async function setup() {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      PushNotifications.addListener("registration", (token) => {
        if (!isMounted) return;
        fetch("/api/me/push-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.value })
        }).catch(() => {});
      });

      const permission = await PushNotifications.requestPermissions();
      if (permission.receive === "granted") {
        await PushNotifications.register();
      }
    }

    setup().catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isNative]);

  return null;
}
