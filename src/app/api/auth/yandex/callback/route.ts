import { NextResponse } from "next/server";
import { createUserSession } from "@/shared/server/user-auth";
import { fetchYandexInfo, resolveYandexUser } from "@/shared/server/yandex-auth";
import { REMOTE_ORIGIN } from "@/shared/lib/native-origins";

const REDIRECT_URI = `${REMOTE_ORIGIN}/api/auth/yandex/callback`;

async function exchangeCodeForToken(code: string): Promise<string | null> {
  const response = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.YANDEX_CLIENT_ID ?? "",
      client_secret: process.env.YANDEX_CLIENT_SECRET ?? "",
      redirect_uri: REDIRECT_URI
    })
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { access_token?: string };
  return data.access_token ?? null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorRedirect = NextResponse.redirect(`${REMOTE_ORIGIN}/?authError=yandex`);

  if (!code) {
    return errorRedirect;
  }

  const accessToken = await exchangeCodeForToken(code);
  if (!accessToken) {
    return errorRedirect;
  }

  const info = await fetchYandexInfo(accessToken);
  if (!info) {
    return errorRedirect;
  }

  const result = await resolveYandexUser(info);
  if (!result.ok) {
    return errorRedirect;
  }

  await createUserSession(result.userId);

  return NextResponse.redirect(`${REMOTE_ORIGIN}/`);
}
