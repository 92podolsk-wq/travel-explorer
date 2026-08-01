import { NextResponse } from "next/server";
import { moveStopToDayWithOrder } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ itineraryId: string; stopId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { itineraryId, stopId } = await params;
  const { day, orderedStopIds } = (await request.json()) as { day?: number; orderedStopIds?: string[] };
  if (typeof day !== "number" || !Array.isArray(orderedStopIds)) {
    return withCors(NextResponse.json({ error: "day and orderedStopIds are required" }, { status: 400 }), request);
  }

  const result = await moveStopToDayWithOrder(user.id, itineraryId, stopId, day, orderedStopIds);
  if (!result) {
    return withCors(NextResponse.json({ error: "Stop not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json(result), request);
}
