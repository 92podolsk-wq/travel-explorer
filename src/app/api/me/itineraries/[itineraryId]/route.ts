import { NextResponse } from "next/server";
import { deleteItinerary, getItinerary, renameItinerary } from "@/shared/server/itineraries-repository";
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
  const { title } = (await request.json()) as { title?: string };
  if (!title?.trim()) {
    return withCors(NextResponse.json({ error: "Title is required" }, { status: 400 }), request);
  }

  const result = await renameItinerary(user.id, itineraryId, title.trim());
  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
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
