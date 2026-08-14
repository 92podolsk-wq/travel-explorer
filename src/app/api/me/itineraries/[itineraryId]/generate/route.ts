import { NextResponse } from "next/server";
import { planItineraryDays } from "@/shared/lib/itinerary-planner";
import type { Language } from "@/shared/i18n/types";
import { generateItinerary } from "@/shared/server/itineraries-repository";
import { readPublishedPois } from "@/shared/server/pois-repository";
import { readPublishedRegions } from "@/shared/server/regions-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getUserPoiState } from "@/shared/server/user-pois-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

const supportedLanguages: Language[] = ["en", "ru", "ja"];

const MAX_DAYS = 14;
const MAX_HOURS_PER_DAY = 14;

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId } = await params;
  const body = (await request.json()) as {
    regionId?: string;
    days?: number;
    hoursPerDay?: number;
    source?: "favorites" | "recommended";
    language?: string;
  };

  const regionId = body.regionId;
  const days = Math.min(MAX_DAYS, Math.max(1, Math.round(body.days ?? 0)));
  const hoursPerDay = Math.min(MAX_HOURS_PER_DAY, Math.max(1, Math.round(body.hoursPerDay ?? 0)));
  const language: Language = supportedLanguages.includes(body.language as Language)
    ? (body.language as Language)
    : "en";

  if (!regionId || !days || !hoursPerDay) {
    return withCors(NextResponse.json({ error: "regionId, days and hoursPerDay are required" }, { status: 400 }), request);
  }

  const [regions, allPois] = await Promise.all([readPublishedRegions(), readPublishedPois()]);
  const region = regions.find((r) => r.id === regionId);
  if (!region) {
    return withCors(NextResponse.json({ error: "Region not found" }, { status: 404 }), request);
  }

  const regionPois = allPois.filter((poi) => poi.regionId === regionId);
  let candidates = regionPois;

  if (body.source === "favorites") {
    const { favoritePoiIds } = await getUserPoiState(user.id);
    const favoriteSet = new Set(favoritePoiIds);
    const favoritesInRegion = regionPois.filter((poi) => favoriteSet.has(poi.id));
    candidates = favoritesInRegion.length > 0 ? favoritesInRegion : regionPois;
  }

  const plan = await planItineraryDays(candidates, days, hoursPerDay * 60, language);
  const title = `${region.name} · ${days} дн.`;

  const result = await generateItinerary(user.id, itineraryId, plan, title);
  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
}
