import { NextResponse } from "next/server";
import { removeDay, updateDay } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string; day: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId, day: dayParam } = await params;
  const day = Number(dayParam);
  if (!Number.isFinite(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const result = await removeDay(user.id, itineraryId, day);
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

  const { itineraryId, day: dayParam } = await params;
  const day = Number(dayParam);
  if (!Number.isFinite(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const body = (await request.json()) as {
    title?: string;
    startMinutes?: number | null;
    lunchEnabled?: boolean | null;
    lunchStartMinutes?: number | null;
    lunchDurationMinutes?: number | null;
  };

  const patch: {
    title?: string;
    startMinutes?: number | null;
    lunchEnabled?: boolean | null;
    lunchStartMinutes?: number | null;
    lunchDurationMinutes?: number | null;
  } = {};
  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return NextResponse.json({ error: "title cannot be empty" }, { status: 400 });
    }
    patch.title = body.title.trim();
  }
  if (body.startMinutes !== undefined) patch.startMinutes = body.startMinutes;
  if (body.lunchEnabled !== undefined) patch.lunchEnabled = body.lunchEnabled;
  if (body.lunchStartMinutes !== undefined) patch.lunchStartMinutes = body.lunchStartMinutes;
  if (body.lunchDurationMinutes !== undefined) patch.lunchDurationMinutes = body.lunchDurationMinutes;

  const result = await updateDay(user.id, itineraryId, day, patch);
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
