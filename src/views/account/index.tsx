"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Eye, MapPin } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { AvatarId } from "@/entities/user/model/avatars";
import { avatarIds } from "@/entities/user/model/avatars";
import type { User } from "@/entities/user/model/types";
import { LanguageSwitcher } from "@/features/language-switcher/ui/language-switcher";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { useHydrateAuth } from "@/shared/model/use-hydrate-auth";
import { Button } from "@/shared/ui/button";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { cn } from "@/shared/lib/cn";
import { SiteHeader } from "@/widgets/site-header/ui/site-header";

type AccountPageProps = {
  initialPois: Poi[];
  initialRegions: Region[];
  initialCountries: Country[];
  initialAreas: Area[];
};

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

export function AccountPage({ initialPois, initialRegions, initialCountries, initialAreas }: AccountPageProps) {
  const router = useRouter();
  const setPois = useExplorerStore((state) => state.setPois);
  const setRegions = useExplorerStore((state) => state.setRegions);
  const setCountries = useExplorerStore((state) => state.setCountries);
  const setAreas = useExplorerStore((state) => state.setAreas);

  useHydrateAuth();

  useEffect(() => {
    setCountries(initialCountries);
    setAreas(initialAreas);
    setRegions(initialRegions);
    setPois(initialPois);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const language = useExplorerStore((state) => state.language);
  const authStatus = useExplorerStore((state) => state.authStatus);
  const currentUser = useExplorerStore((state) => state.currentUser);
  const pois = useExplorerStore((state) => state.pois);
  const regions = useExplorerStore((state) => state.regions);
  const favorites = useExplorerStore((state) => state.favorites);
  const viewedPoiIds = useExplorerStore((state) => state.viewedPoiIds);
  const visitedPoiIds = useExplorerStore((state) => state.visitedPoiIds);
  const selectPoiFromMap = useExplorerStore((state) => state.selectPoiFromMap);
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const clearViewedPois = useExplorerStore((state) => state.clearViewedPois);
  const clearFavoritePois = useExplorerStore((state) => state.clearFavoritePois);
  const clearVisitedPois = useExplorerStore((state) => state.clearVisitedPois);
  const dict = getTranslations(language);
  const t = dict.auth;
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  function regionName(regionId: string) {
    const region = regions.find((r) => r.id === regionId);
    return region?.nameByLanguage[language] ?? "";
  }

  function goToPoi(poiId: string) {
    selectPoiFromMap(poiId);
    router.push("/");
  }

  function handleClearViewed() {
    if (window.confirm(t.clearViewedConfirm)) {
      clearViewedPois();
    }
  }

  function handleClearSaved() {
    if (window.confirm(t.clearSavedConfirm)) {
      clearFavoritePois();
    }
  }

  function handleClearVisited() {
    if (window.confirm(t.clearVisitedConfirm)) {
      clearVisitedPois();
    }
  }

  async function handleSelectAvatar(avatarId: AvatarId) {
    const res = await fetch("/api/me/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId })
    });

    if (res.ok) {
      const data = (await res.json()) as { user: User };
      hydrateAuth(data.user);
      setIsAvatarPickerOpen(false);
    }
  }

  if (authStatus === "loading") {
    return (
      <main className="flex min-h-dvh flex-col bg-muted">
        <SiteHeader />
      </main>
    );
  }

  if (authStatus === "guest") {
    return (
      <main className="flex min-h-dvh flex-col bg-muted">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-muted-foreground">{t.loginTitle}</p>
          <Button onClick={() => router.push("/")}>{t.login}</Button>
        </div>
      </main>
    );
  }

  const favoritePois = pois.filter((poi) => favorites.includes(poi.id));
  const viewedPois = pois.filter((poi) => viewedPoiIds.includes(poi.id));
  const visitedPois = pois.filter((poi) => visitedPoiIds.includes(poi.id));

  return (
    <main className="flex min-h-dvh flex-col bg-muted">
      <SiteHeader />
      <div className="flex-1 px-6 py-10">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <ProfileAvatar avatarId={currentUser?.avatarId} className="h-14 w-14" />
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen((value) => !value)}
                  className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
                >
                  {t.changeAvatar}
                </button>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{currentUser?.name || currentUser?.email}</h1>
                {currentUser && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.memberSince} {new Date(currentUser.createdAt).toLocaleDateString(language)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {dict.app.language}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          {isAvatarPickerOpen && (
            <section className="flex flex-col gap-3 rounded-md border border-border bg-white/[0.78] p-4">
              <h2 className="text-sm font-semibold text-foreground">{t.chooseAvatar}</h2>
              <div className="grid grid-cols-6 gap-3">
                {avatarIds.map((avatarId) => {
                  const isSelected = currentUser?.avatarId === avatarId;
                  return (
                    <button
                      key={avatarId}
                      type="button"
                      onClick={() => handleSelectAvatar(avatarId)}
                      aria-label={avatarId}
                      className={cn(
                        "relative flex items-center justify-center rounded-full border-2 p-0.5 transition hover:-translate-y-0.5",
                        isSelected ? "border-primary" : "border-transparent"
                      )}
                    >
                      <ProfileAvatar avatarId={avatarId} className="h-11 w-11" />
                      {isSelected && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Bookmark className="h-4 w-4 text-primary" />
                {t.savedPlaces}
              </h2>
              {favoritePois.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSaved}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.clearSaved}
                </button>
              )}
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {t.visitedPlaces}
              </h2>
              {visitedPois.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearVisited}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.clearVisited}
                </button>
              )}
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Eye className="h-4 w-4 text-primary" />
                {t.viewedPlaces}
              </h2>
              {viewedPois.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearViewed}
                  className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {t.clearViewed}
                </button>
              )}
            </div>
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
      </div>
    </main>
  );
}
