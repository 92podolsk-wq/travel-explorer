import { createUserFromYandex, findUserByUsername, findUserByYandexId, findUserByEmail } from "@/shared/server/users-repository";
import { prisma } from "@/shared/server/prisma-client";

export type YandexInfo = {
  id: string;
  login: string;
  default_email?: string;
  emails?: string[];
  real_name?: string;
  first_name?: string;
  last_name?: string;
};

export async function fetchYandexInfo(oauthToken: string): Promise<YandexInfo | null> {
  const response = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${oauthToken}` }
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

export type YandexResolveResult = { ok: true; userId: string } | { ok: false; error: string; status: number };

export async function resolveYandexUser(info: YandexInfo): Promise<YandexResolveResult> {
  const email = info.default_email ?? info.emails?.[0] ?? null;

  let existing = await findUserByYandexId(info.id);

  if (!existing && email) {
    const existingByEmail = await findUserByEmail(email.toLowerCase());
    if (existingByEmail) {
      existing = await prisma.user.update({ where: { id: existingByEmail.id }, data: { yandexId: info.id } });
    }
  }

  if (existing?.isBlocked) {
    return { ok: false, error: "Этот аккаунт заблокирован.", status: 403 };
  }

  if (existing) {
    return { ok: true, userId: existing.id };
  }

  if (!email) {
    return { ok: false, error: "Яндекс не предоставил доступ к email — вход невозможен.", status: 400 };
  }

  const username = await generateUsername(info.login);
  const name = info.real_name || [info.first_name, info.last_name].filter(Boolean).join(" ") || null;
  const user = await createUserFromYandex(email.toLowerCase(), username, info.id, name);
  return { ok: true, userId: user.id };
}
