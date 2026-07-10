import { NextResponse } from "next/server";
import { reorderDayStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { day, orderedPoiIds } = (await request.json()) as { day?: number; orderedPoiIds?: string[] };
  if (!Array.isArray(orderedPoiIds) || typeof day !== "number") {
    return NextResponse.json({ error: "day and orderedPoiIds are required" }, { status: 400 });
  }

  const result = await reorderDayStops(user.id, day, orderedPoiIds);
  if (!result) {
    return NextResponse.json({ error: "Invalid stop list" }, { status: 400 });
  }

  return NextResponse.json(result);
}
