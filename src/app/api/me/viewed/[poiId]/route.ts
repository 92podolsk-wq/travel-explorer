import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { markViewed } from "@/shared/server/user-pois-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ poiId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { poiId } = await params;
  await markViewed(user.id, poiId);

  return withCors(NextResponse.json({ success: true }), request);
}
