import { NextResponse } from "next/server";
import { addMarkerStop, addStop, addStops, clearStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

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
    return withCors(NextResponse.json({ error: "poiId, poiIds, or customMarkerId is required" }, { status: 400 }), request);
  }

  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result, { status: 201 }), request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId } = await params;
  const result = await clearStops(user.id, itineraryId);
  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
}
