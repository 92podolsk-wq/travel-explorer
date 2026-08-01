import { NextResponse } from "next/server";
import { isAvatarId } from "@/entities/user/model/avatars";
import { getCurrentUser } from "@/shared/server/user-auth";
import { updateUserAvatar } from "@/shared/server/users-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { avatarId } = (await request.json()) as { avatarId?: string };

  if (!avatarId || !isAvatarId(avatarId)) {
    return withCors(NextResponse.json({ error: "Invalid avatar" }, { status: 400 }), request);
  }

  const updated = await updateUserAvatar(user.id, avatarId);

  return withCors(NextResponse.json({ user: updated }), request);
}
