"use client";

import { useEffect, useState } from "react";
import type { Itinerary } from "@/entities/itinerary/model/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { TripView } from "@/views/trip";

type SharedTripViewProps = { itineraryId: string };

export function SharedTripView({ itineraryId }: SharedTripViewProps) {
  const [itinerary, setItinerary] = useState<Itinerary | null | undefined>(undefined);

  useEffect(() => {
    apiFetch(`/api/me/itineraries/shared-with-me/${itineraryId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setItinerary);
  }, [itineraryId]);

  if (itinerary === undefined) return null;
  if (itinerary === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Not found
      </div>
    );
  }

  return <TripView itinerary={itinerary} />;
}
