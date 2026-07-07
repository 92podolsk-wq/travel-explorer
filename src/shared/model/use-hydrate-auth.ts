"use client";

import { useEffect } from "react";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { useExplorerStore } from "./explorer-store";

export function useHydrateAuth() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as AuthMeResponse;
      hydrateAuth(
        data.user,
        data.user
          ? {
              favoritePoiIds: data.favoritePoiIds ?? [],
              viewedPoiIds: data.viewedPoiIds ?? [],
              visitedPoiIds: data.visitedPoiIds ?? []
            }
          : undefined
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
