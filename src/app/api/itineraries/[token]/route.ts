import { NextResponse } from "next/server";
import { getItineraryByShareToken } from "@/shared/server/itineraries-repository";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  const itinerary = await getItineraryByShareToken(token);

  if (!itinerary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(itinerary);
}
