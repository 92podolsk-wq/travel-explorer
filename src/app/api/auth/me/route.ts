import { NextResponse } from "next/server";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getUserPoiState } from "@/shared/server/user-pois-repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null } satisfies AuthMeResponse);
  }

  const poiState = await getUserPoiState(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarId: user.avatarId,
      createdAt: user.createdAt.toISOString()
    },
    ...poiState
  } satisfies AuthMeResponse);
}
