import { NextResponse } from "next/server";
import { ItineraryLimitError, createItinerary, listItineraries } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await listItineraries(user.id));
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json(await createItinerary(user.id), { status: 201 });
  } catch (error) {
    if (error instanceof ItineraryLimitError) {
      return NextResponse.json({ error: "MAX_ITINERARIES" }, { status: 400 });
    }
    throw error;
  }
}
