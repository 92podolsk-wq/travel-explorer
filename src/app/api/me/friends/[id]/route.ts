import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { removeFriendship } from "@/shared/server/friendships-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// Covers declining an incoming request, cancelling an outgoing one, and
// unfriending an existing friend — all are the same "delete the row" action.
export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { id } = await params;
  const removed = await removeFriendship(id, user.id);
  if (!removed) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
