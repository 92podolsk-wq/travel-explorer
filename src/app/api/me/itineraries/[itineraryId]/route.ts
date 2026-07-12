import { NextResponse } from "next/server";
import { deleteItinerary, getItinerary, renameItinerary } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const itinerary = await getItinerary(user.id, itineraryId);
  if (!itinerary) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(itinerary);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const { title } = (await request.json()) as { title?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const result = await renameItinerary(user.id, itineraryId, title.trim());
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const deleted = await deleteItinerary(user.id, itineraryId);
  if (!deleted) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
