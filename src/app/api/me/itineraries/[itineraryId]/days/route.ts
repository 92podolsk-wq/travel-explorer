import { NextResponse } from "next/server";
import { addDay } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ itineraryId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itineraryId } = await params;
  const result = await addDay(user.id, itineraryId);
  if (!result) {
    return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}
