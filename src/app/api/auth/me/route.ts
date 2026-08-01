import { NextResponse } from "next/server";
import type { AuthMeResponse } from "@/entities/user/model/types";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getUserPoiState } from "@/shared/server/user-pois-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return withCors(NextResponse.json({ user: null } satisfies AuthMeResponse), request);
  }

  const poiState = await getUserPoiState(user.id);

  return withCors(
    NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarId: user.avatarId,
        createdAt: user.createdAt.toISOString()
      },
      ...poiState
    } satisfies AuthMeResponse),
    request
  );
}
