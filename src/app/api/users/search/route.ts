import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { searchUsersByUsername } from "@/shared/server/friendships-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return withCors(NextResponse.json({ users: [] }), request);
  }

  const users = await searchUsersByUsername(query, user.id);
  return withCors(NextResponse.json({ users }), request);
}
