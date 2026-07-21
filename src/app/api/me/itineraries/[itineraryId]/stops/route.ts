import { NextResponse } from "next/server";
import { addMarkerStop, addStop, addStops, clearStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const { poiId, poiIds, customMarkerId } = (await request.json()) as {
    poiId?: string;
    poiIds?: string[];
    customMarkerId?: string;
  };

  let result;
  if (Array.isArray(poiIds) && poiIds.length > 0) {
    result = await addStops(user.id, itineraryId, poiIds);
  } else if (poiId) {
    result = await addStop(user.id, itineraryId, poiId);
  } else if (customMarkerId) {
    result = await addMarkerStop(user.id, itineraryId, customMarkerId);
  } else {
    return NextResponse.json({ error: "poiId, poiIds, or customMarkerId is required" }, { status: 400 });
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
