import { NextResponse } from "next/server";
import { ItineraryLimitError, createItinerary, listItineraries } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  return withCors(NextResponse.json(await listItineraries(user.id)), request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  try {
    return withCors(NextResponse.json(await createItinerary(user.id), { status: 201 }), request);
  } catch (error) {
    if (error instanceof ItineraryLimitError) {
      return withCors(NextResponse.json({ error: "MAX_ITINERARIES" }, { status: 400 }), request);
    }
    throw error;
  }
}
