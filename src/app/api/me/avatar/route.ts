import { NextResponse } from "next/server";
import { isAvatarId } from "@/entities/user/model/avatars";
import { getCurrentUser } from "@/shared/server/user-auth";
import { updateUserAvatar } from "@/shared/server/users-repository";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { avatarId } = (await request.json()) as { avatarId?: string };

  if (!avatarId || !isAvatarId(avatarId)) {
    return NextResponse.json({ error: "Invalid avatar" }, { status: 400 });
  }

  const updated = await updateUserAvatar(user.id, avatarId);

  return NextResponse.json({ user: updated });
}
