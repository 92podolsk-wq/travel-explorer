import { NextResponse } from "next/server";
import type { FriendsResponse } from "@/entities/user/model/types";
import { getCurrentUser } from "@/shared/server/user-auth";
import { listFriends, listIncomingRequests, listOutgoingRequests } from "@/shared/server/friendships-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncomingRequests(user.id),
    listOutgoingRequests(user.id)
  ]);

  return withCors(NextResponse.json({ friends, incoming, outgoing } satisfies FriendsResponse), request);
}
