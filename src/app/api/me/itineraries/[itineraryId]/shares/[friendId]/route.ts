import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { unshareItinerary } from "@/shared/server/itinerary-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ itineraryId: string; friendId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId, friendId } = await params;
  const removed = await unshareItinerary(itineraryId, user.id, friendId);
  if (!removed) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
