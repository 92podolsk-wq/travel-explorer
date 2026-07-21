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
  const { day, orderedStopIds } = (await request.json()) as { day?: number; orderedStopIds?: string[] };
  if (!Array.isArray(orderedStopIds) || typeof day !== "number") {
    return NextResponse.json({ error: "day and orderedStopIds are required" }, { status: 400 });
  }

  const result = await reorderDayStops(user.id, itineraryId, day, orderedStopIds);
  if (!result) {
    return NextResponse.json({ error: "Invalid stop list" }, { status: 400 });
  }

  return NextResponse.json(result);
}
