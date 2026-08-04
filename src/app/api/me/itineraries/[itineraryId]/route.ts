import { NextResponse } from "next/server";
import { deleteItinerary, getItinerary, renameItinerary, updateItineraryStartDate } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
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
  const itinerary = await getItinerary(user.id, itineraryId);
  if (!itinerary) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(itinerary), request);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId } = await params;
  const body = (await request.json()) as { title?: string; startDate?: string | null };

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return withCors(NextResponse.json({ error: "Title is required" }, { status: 400 }), request);
    }
    const result = await renameItinerary(user.id, itineraryId, body.title.trim());
    if (!result) {
      return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
    }
    return withCors(NextResponse.json(result), request);
  }

  if (body.startDate !== undefined) {
    const result = await updateItineraryStartDate(user.id, itineraryId, body.startDate);
    if (!result) {
      return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
    }
    return withCors(NextResponse.json(result), request);
  }

  return withCors(NextResponse.json({ error: "Nothing to update" }, { status: 400 }), request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId } = await params;
  const deleted = await deleteItinerary(user.id, itineraryId);
  if (!deleted) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ ok: true }), request);
}
