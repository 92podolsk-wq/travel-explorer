import { NextResponse } from "next/server";
import { findUserById } from "@/shared/server/users-repository";
import { createUserSession } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";
import { fetchYandexInfo, resolveYandexUser } from "@/shared/server/yandex-auth";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// Used by the native app: the Yandex AuthSDK returns an OAuth token directly
// on-device (no redirect), which we verify here and exchange for our own
// session token. The web flow instead uses /api/auth/yandex/callback.
export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };

  if (!token) {
    return withCors(NextResponse.json({ error: "Не передан токен Яндекса." }, { status: 400 }), request);
  }

  const info = await fetchYandexInfo(token);
  if (!info) {
    return withCors(NextResponse.json({ error: "Не удалось подтвердить вход через Яндекс." }, { status: 401 }), request);
  }

  const result = await resolveYandexUser(info);
  if (!result.ok) {
    return withCors(NextResponse.json({ error: result.error }, { status: result.status }), request);
  }

  const user = await findUserById(result.userId);
  if (!user) {
    return withCors(NextResponse.json({ error: "Не удалось подтвердить вход через Яндекс." }, { status: 500 }), request);
  }

  const { token: sessionToken } = await createUserSession(user.id);

  return withCors(NextResponse.json({ user, token: sessionToken }), request);
}
