import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getItineraryById } from "@/shared/server/itineraries-repository";
import { hasItineraryShareAccess } from "@/shared/server/itinerary-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId } = await params;
  if (!(await hasItineraryShareAccess(itineraryId, user.id))) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(itinerary), request);
}
