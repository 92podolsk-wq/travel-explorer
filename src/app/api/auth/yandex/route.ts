import { NextResponse } from "next/server";
import { createUserFromYandex, findUserByUsername, findUserByYandexId, findUserByEmail } from "@/shared/server/users-repository";
import { prisma } from "@/shared/server/prisma-client";
import { createUserSession } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

type YandexInfo = {
  id: string;
  login: string;
  default_email?: string;
  emails?: string[];
  real_name?: string;
  first_name?: string;
  last_name?: string;
};

async function fetchYandexInfo(token: string): Promise<YandexInfo | null> {
  const response = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${token}` }
  });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as YandexInfo;
}

async function generateUsername(login: string): Promise<string> {
  const base = login.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 16) || "user";
  let candidate = base.padEnd(3, "0");
  while (await findUserByUsername(candidate)) {
    candidate = `${base}_${Math.random().toString(36).slice(2, 6)}`;
  }
  return candidate;
}

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };

  if (!token) {
    return withCors(NextResponse.json({ error: "Не передан токен Яндекса." }, { status: 400 }), request);
  }

  const info = await fetchYandexInfo(token);
  if (!info) {
    return withCors(NextResponse.json({ error: "Не удалось подтвердить вход через Яндекс." }, { status: 401 }), request);
  }

  const email = info.default_email ?? info.emails?.[0] ?? null;

  let existing = await findUserByYandexId(info.id);

  if (!existing && email) {
    const existingByEmail = await findUserByEmail(email.toLowerCase());
    if (existingByEmail) {
      existing = await prisma.user.update({ where: { id: existingByEmail.id }, data: { yandexId: info.id } });
    }
  }

  if (existing?.isBlocked) {
    return withCors(NextResponse.json({ error: "Этот аккаунт заблокирован." }, { status: 403 }), request);
  }

  const user =
    existing ??
    (await (async () => {
      if (!email) {
        return null;
      }
      const username = await generateUsername(info.login);
      const name = info.real_name || [info.first_name, info.last_name].filter(Boolean).join(" ") || null;
      return createUserFromYandex(email.toLowerCase(), username, info.id, name);
    })());

  if (!user) {
    return withCors(
      NextResponse.json({ error: "Яндекс не предоставил доступ к email — вход невозможен." }, { status: 400 }),
      request
    );
  }

  const { token: sessionToken } = await createUserSession(user.id);

  return withCors(
    NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarId: user.avatarId,
        hideFromSearch: user.hideFromSearch,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
      },
      token: sessionToken
    }),
    request
  );
}
