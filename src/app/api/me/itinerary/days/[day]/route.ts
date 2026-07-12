import { NextResponse } from "next/server";
import { removeDay, renameDay } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ day: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const day = Number((await params).day);
  if (!Number.isFinite(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const result = await removeDay(user.id, day);
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

  const day = Number((await params).day);
  if (!Number.isFinite(day)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const { title } = (await request.json()) as { title?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const result = await renameDay(user.id, day, title.trim());
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
