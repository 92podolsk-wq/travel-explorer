"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, Map as MapIcon, Route, User } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useIsNativeApp } from "@/shared/lib/use-is-native-app";
import { cn } from "@/shared/lib/cn";

function MobileAppTabBarInner() {
  const isNative = useIsNativeApp();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useExplorerStore((state) => state.language);
  const dict = getTranslations(language);

  if (!isNative || pathname.startsWith("/admin")) {
    return null;
  }

  const accountTab = pathname === "/account" ? (searchParams.get("tab") ?? "route") : null;

  const items = [
    {
      key: "map",
      label: dict.app.mobileNavMap,
      icon: MapIcon,
      active: pathname === "/",
      onClick: () => router.push("/")
    },
    {
      key: "route",
      label: dict.auth.tabRoute,
      icon: Route,
      active: accountTab === "route",
      onClick: () => router.push("/account?tab=route")
    },
    {
      key: "saved",
      label: dict.auth.tabSaved,
      icon: Bookmark,
      active: accountTab === "saved",
      onClick: () => router.push("/account?tab=saved")
    },
    {
      key: "profile",
      label: dict.auth.tabProfile,
      icon: User,
      active: accountTab === "profile",
      onClick: () => router.push("/account?tab=profile")
    }
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex items-stretch border-t border-border bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onClick}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition",
              item.active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function MobileAppTabBar() {
  return (
    <Suspense fallback={null}>
      <MobileAppTabBarInner />
    </Suspense>
  );
}
