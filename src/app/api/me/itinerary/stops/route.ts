import { NextResponse } from "next/server";
import { addStop, addStops, clearStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId, poiIds } = (await request.json()) as { poiId?: string; poiIds?: string[] };

  if (Array.isArray(poiIds) && poiIds.length > 0) {
    return NextResponse.json(await addStops(user.id, poiIds), { status: 201 });
  }

  if (!poiId) {
    return NextResponse.json({ error: "poiId is required" }, { status: 400 });
  }

  return NextResponse.json(await addStop(user.id, poiId), { status: 201 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await clearStops(user.id));
}
