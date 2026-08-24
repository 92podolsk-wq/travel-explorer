"use client";

import { useState } from "react";
import { useExplorerStore } from "./explorer-store";

// Shared by the saved-tab CTA card and the route-tab header — both surface
// a "share this itinerary" button, so this reads the active itinerary
// straight from the store rather than being threaded through as props.
export function useShareItinerary() {
  const itinerary = useExplorerStore((state) => state.itinerary);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  async function handleShareItinerary() {
    if (!itinerary) return;
    const url = `${window.location.origin}/trip/${itinerary.shareToken}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: itinerary.title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2000);
  }

  return { handleShareItinerary, isLinkCopied };
}
