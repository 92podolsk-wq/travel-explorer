import { NextResponse } from "next/server";
import { reorderDayStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const { day, orderedPoiIds } = (await request.json()) as { day?: number; orderedPoiIds?: string[] };
  if (!Array.isArray(orderedPoiIds) || typeof day !== "number") {
    return NextResponse.json({ error: "day and orderedPoiIds are required" }, { status: 400 });
  }

  const result = await reorderDayStops(user.id, itineraryId, day, orderedPoiIds);
  if (!result) {
    return NextResponse.json({ error: "Invalid stop list" }, { status: 400 });
  }

  return NextResponse.json(result);
}
