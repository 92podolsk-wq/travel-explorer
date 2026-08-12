"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Route } from "lucide-react";
import type { SharedItinerarySummary } from "@/entities/sharing/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { isNativeLocalShell } from "@/shared/lib/native-origins";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

export function SharedItinerariesCard() {
  const router = useRouter();
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language).auth;
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [shared, setShared] = useState<SharedItinerarySummary[] | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    apiFetch("/api/me/itineraries/shared-with-me")
      .then((res) => res.json())
      .then((body: { itineraries: SharedItinerarySummary[] }) => setShared(body.itineraries));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser || !shared || shared.length === 0) return null;

  function openSharedTrip(itineraryId: string) {
    const path = `/account/shared-trip/${itineraryId}`;
    if (isNativeLocalShell()) {
      window.open(`https://wayora.ru${path}`, "_blank");
      return;
    }
    router.push(path);
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Route className="h-4 w-4 text-primary" />
        {t.sharedItinerariesTitle}
      </h2>
      {shared.map(({ owner, itinerary }) => (
        <button
          key={itinerary.id}
          type="button"
          onClick={() => openSharedTrip(itinerary.id)}
          className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-2 text-left hover:bg-muted/60"
        >
          <div className="flex min-w-0 items-center gap-2">
            <ProfileAvatar avatarId={owner.avatarId} className="h-7 w-7 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{itinerary.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{owner.name || `@${owner.username}`}</p>
            </div>
          </div>
        </button>
      ))}
    </section>
  );
}
