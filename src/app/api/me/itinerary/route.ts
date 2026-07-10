import { NextResponse } from "next/server";
import { getOrCreateItinerary, renameItinerary } from "@/shared/server/itineraries-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getOrCreateItinerary(user.id));
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = (await request.json()) as { title?: string };
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  return NextResponse.json(await renameItinerary(user.id, title.trim()));
}
