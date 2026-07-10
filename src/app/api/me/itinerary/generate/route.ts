import { NextResponse } from "next/server";
import { planItineraryDays } from "@/shared/lib/itinerary-planner";
import { generateItinerary } from "@/shared/server/itineraries-repository";
import { readPublishedPois } from "@/shared/server/pois-repository";
import { readPublishedRegions } from "@/shared/server/regions-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getUserPoiState } from "@/shared/server/user-pois-repository";

const MAX_DAYS = 14;
const MAX_HOURS_PER_DAY = 14;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    regionId?: string;
    days?: number;
    hoursPerDay?: number;
    source?: "favorites" | "recommended";
  };

  const regionId = body.regionId;
  const days = Math.min(MAX_DAYS, Math.max(1, Math.round(body.days ?? 0)));
  const hoursPerDay = Math.min(MAX_HOURS_PER_DAY, Math.max(1, Math.round(body.hoursPerDay ?? 0)));

  if (!regionId || !days || !hoursPerDay) {
    return NextResponse.json({ error: "regionId, days and hoursPerDay are required" }, { status: 400 });
  }

  const [regions, allPois] = await Promise.all([readPublishedRegions(), readPublishedPois()]);
  const region = regions.find((r) => r.id === regionId);
  if (!region) {
    return NextResponse.json({ error: "Region not found" }, { status: 404 });
  }

  const regionPois = allPois.filter((poi) => poi.regionId === regionId);
  let candidates = regionPois;

  if (body.source === "favorites") {
    const { favoritePoiIds } = await getUserPoiState(user.id);
    const favoriteSet = new Set(favoritePoiIds);
    const favoritesInRegion = regionPois.filter((poi) => favoriteSet.has(poi.id));
    candidates = favoritesInRegion.length > 0 ? favoritesInRegion : regionPois;
  }

  const plan = planItineraryDays(candidates, days, hoursPerDay * 60);
  const title = `${region.name} · ${days} дн.`;

  return NextResponse.json(await generateItinerary(user.id, plan, title));
}
