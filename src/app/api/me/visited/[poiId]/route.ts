import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { toggleVisited } from "@/shared/server/user-pois-repository";

type RouteParams = { params: Promise<{ poiId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId } = await params;
  const isVisited = await toggleVisited(user.id, poiId);

  return NextResponse.json({ isVisited });
}
