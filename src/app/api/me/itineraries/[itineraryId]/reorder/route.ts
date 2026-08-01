import { NextResponse } from "next/server";
import { reorderDayStops } from "@/shared/server/itineraries-repository";
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
  const { day, orderedStopIds } = (await request.json()) as { day?: number; orderedStopIds?: string[] };
  if (!Array.isArray(orderedStopIds) || typeof day !== "number") {
    return withCors(NextResponse.json({ error: "day and orderedStopIds are required" }, { status: 400 }), request);
  }

  const result = await reorderDayStops(user.id, itineraryId, day, orderedStopIds);
  if (!result) {
    return withCors(NextResponse.json({ error: "Invalid stop list" }, { status: 400 }), request);
  }

  return withCors(NextResponse.json(result), request);
}
