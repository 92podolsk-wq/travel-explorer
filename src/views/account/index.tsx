"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Eye, MapPin } from "lucide-react";
import type { AuthMeResponse, User } from "@/entities/user/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Button } from "@/shared/ui/button";

type LoadState = { mode: "loading" } | { mode: "guest" } | { mode: "ready" };

function PoiRow({ poi, regionName, onSelect }: { poi: Poi; regionName: string; onSelect: () => void }) {
  const thumbnail = poi.photos[0]?.url;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-md border border-border bg-white/[0.78] p-2.5 text-left shadow-sm transition hover:bg-muted/60"
    >
      {thumbnail ? (
        <img src={thumbnail} alt={poi.name} className="h-12 w-12 shrink-0 rounded object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          <MapPin className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{poi.name}</p>
        <p className="truncate text-xs text-muted-foreground">{regionName}</p>
      </div>
    </button>
  );
}

export function AccountPage() {
  const router = useRouter();
  const language = useExplorerStore((state) => state.language);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const t = getTranslations(language).auth;

  const [loadState, setLoadState] = useState<LoadState>({ mode: "loading" });
  const [user, setUser] = useState<User | null>(null);
  const [pois, setPois] = useState<Poi[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [favoritePoiIds, setFavoritePoiIds] = useState<string[]>([]);
  const [viewedPoiIds, setViewedPoiIds] = useState<string[]>([]);
  const [visitedPoiIds, setVisitedPoiIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const [meRes, poisRes, regionsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pois"),
        fetch("/api/regions")
      ]);

      const meData = (await meRes.json()) as AuthMeResponse;
      setPois((await poisRes.json()) as Poi[]);
      setRegions((await regionsRes.json()) as Region[]);

      if (!meData.user) {
        setLoadState({ mode: "guest" });
        return;
      }

      setUser(meData.user);
      setFavoritePoiIds(meData.favoritePoiIds ?? []);
      setViewedPoiIds(meData.viewedPoiIds ?? []);
      setVisitedPoiIds(meData.visitedPoiIds ?? []);
      setLoadState({ mode: "ready" });
    })();
  }, []);

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  function goToPoi(poiId: string) {
    selectPoiFromMap(poiId);
    router.push("/");
  }

  if (loadState.mode === "loading") {
    return <main className="flex min-h-dvh items-center justify-center bg-muted" />;
  }

  if (loadState.mode === "guest") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted px-6 text-center">
        <p className="text-sm text-muted-foreground">{t.loginTitle}</p>
        <Button onClick={() => router.push("/")}>{t.login}</Button>
      </main>
    );
  }

  const favoritePois = pois.filter((poi) => favoritePoiIds.includes(poi.id));
  const viewedPois = pois.filter((poi) => viewedPoiIds.includes(poi.id));
  const visitedPois = pois.filter((poi) => visitedPoiIds.includes(poi.id));

  return (
    <main className="min-h-dvh bg-muted px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{user?.name || user?.email}</h1>
          {user && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t.memberSince} {new Date(user.createdAt).toLocaleDateString(language)}
            </p>
          )}
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            {t.savedPlaces}
          </h2>
          {favoritePois.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noSavedPlaces}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {favoritePois.map((poi) => (
                <PoiRow key={poi.id} poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {t.visitedPlaces}
          </h2>
          {visitedPois.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noVisitedPlaces}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {visitedPois.map((poi) => (
                <PoiRow key={poi.id} poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Eye className="h-4 w-4 text-primary" />
            {t.viewedPlaces}
          </h2>
          {viewedPois.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.noViewedPlaces}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {viewedPois.map((poi) => (
                <PoiRow key={poi.id} poi={poi} regionName={regionName(poi.regionId)} onSelect={() => goToPoi(poi.id)} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
