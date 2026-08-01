import { NextResponse } from "next/server";
import { addDay } from "@/shared/server/itineraries-repository";
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
  const result = await addDay(user.id, itineraryId);
  if (!result) {
    return withCors(NextResponse.json({ error: "Itinerary not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result, { status: 201 }), request);
}
