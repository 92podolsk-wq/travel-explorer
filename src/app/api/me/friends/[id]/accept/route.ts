import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { acceptFriendRequest } from "@/shared/server/friendships-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { id } = await params;
  const result = await acceptFriendRequest(id, user.id);
  if (!result) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
