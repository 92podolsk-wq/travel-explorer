import { NextResponse } from "next/server";
import { addStop, addStops, clearStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const { poiId, poiIds } = (await request.json()) as { poiId?: string; poiIds?: string[] };

  let result;
  if (Array.isArray(poiIds) && poiIds.length > 0) {
    result = await addStops(user.id, itineraryId, poiIds);
  } else if (poiId) {
    result = await addStop(user.id, itineraryId, poiId);
  } else {
    return NextResponse.json({ error: "poiId is required" }, { status: 400 });
  }

  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const result = await clearStops(user.id, itineraryId);
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
