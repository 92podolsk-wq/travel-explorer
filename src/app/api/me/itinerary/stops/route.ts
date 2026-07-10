import { NextResponse } from "next/server";
import { addStop } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId } = (await request.json()) as { poiId?: string };
  if (!poiId) {
    return NextResponse.json({ error: "poiId is required" }, { status: 400 });
  }

  return NextResponse.json(await addStop(user.id, poiId), { status: 201 });
}
