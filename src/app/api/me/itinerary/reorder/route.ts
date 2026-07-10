import { NextResponse } from "next/server";
import { reorderStops } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderedPoiIds } = (await request.json()) as { orderedPoiIds?: string[] };
  if (!Array.isArray(orderedPoiIds)) {
    return NextResponse.json({ error: "orderedPoiIds is required" }, { status: 400 });
  }

  const result = await reorderStops(user.id, orderedPoiIds);
  if (!result) {
    return NextResponse.json({ error: "Invalid stop list" }, { status: 400 });
  }

  return NextResponse.json(result);
}
