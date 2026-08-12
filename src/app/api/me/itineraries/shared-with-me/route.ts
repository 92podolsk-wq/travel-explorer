import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { listItinerariesSharedWithMe } from "@/shared/server/itinerary-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const itineraries = await listItinerariesSharedWithMe(user.id);
  return withCors(NextResponse.json({ itineraries }), request);
}
