import { NextResponse } from "next/server";
import { removeStop, updateStop } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string; poiId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId, poiId } = await params;
  const result = await removeStop(user.id, itineraryId, poiId);
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId, poiId } = await params;
  const { day, durationOverrideMinutes } = (await request.json()) as {
    day?: number;
    durationOverrideMinutes?: number | null;
  };

  if (day !== undefined && (typeof day !== "number" || day < 1)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const result = await updateStop(user.id, itineraryId, poiId, { day, durationOverrideMinutes });
  if (!result) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
