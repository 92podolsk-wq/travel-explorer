import { NextResponse } from "next/server";
import { moveStopToDayWithOrder } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string; stopId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId, stopId } = await params;
  const { day, orderedStopIds } = (await request.json()) as { day?: number; orderedStopIds?: string[] };
  if (typeof day !== "number" || !Array.isArray(orderedStopIds)) {
    return NextResponse.json({ error: "day and orderedStopIds are required" }, { status: 400 });
  }

  const result = await moveStopToDayWithOrder(user.id, itineraryId, stopId, day, orderedStopIds);
  if (!result) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
