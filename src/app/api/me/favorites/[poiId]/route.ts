import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { toggleFavorite } from "@/shared/server/user-pois-repository";

type RouteParams = { params: Promise<{ poiId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId } = await params;
  const isFavorite = await toggleFavorite(user.id, poiId);

  return NextResponse.json({ isFavorite });
}
