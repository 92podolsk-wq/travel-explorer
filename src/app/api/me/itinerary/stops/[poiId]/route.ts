import { NextResponse } from "next/server";
import { moveStopToDay, removeStop } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ poiId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId } = await params;
  return NextResponse.json(await removeStop(user.id, poiId));
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId } = await params;
  const { day } = (await request.json()) as { day?: number };
  if (typeof day !== "number" || day < 1) {
    return NextResponse.json({ error: "day is required" }, { status: 400 });
  }

  const result = await moveStopToDay(user.id, poiId, day);
  if (!result) {
    return NextResponse.json({ error: "Stop not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
