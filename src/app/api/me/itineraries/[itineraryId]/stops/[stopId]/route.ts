import { NextResponse } from "next/server";
import { removeStopById, updateStopById } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ itineraryId: string; stopId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId, stopId } = await params;
  const result = await removeStopById(user.id, itineraryId, stopId);
  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId, stopId } = await params;
  const { day, durationOverrideMinutes, notes } = (await request.json()) as {
    day?: number;
    durationOverrideMinutes?: number | null;
    notes?: string | null;
  };

  if (day !== undefined && (typeof day !== "number" || day < 1)) {
    return withCors(NextResponse.json({ error: "Invalid day" }, { status: 400 }), request);
  }

  const result = await updateStopById(user.id, itineraryId, stopId, { day, durationOverrideMinutes, notes });
  if (!result) {
    return withCors(NextResponse.json({ error: "Stop not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
}
