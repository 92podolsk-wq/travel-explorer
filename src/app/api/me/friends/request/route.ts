import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { findUserByUsername } from "@/shared/server/users-repository";
import { sendFriendRequest } from "@/shared/server/friendships-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { username } = (await request.json()) as { username?: string };
  const normalized = username?.trim().toLowerCase();
  if (!normalized) {
    return withCors(NextResponse.json({ error: "Укажите логин." }, { status: 400 }), request);
  }

  const target = await findUserByUsername(normalized);
  if (!target || target.id === user.id) {
    return withCors(NextResponse.json({ error: "Пользователь не найден." }, { status: 404 }), request);
  }

  const result = await sendFriendRequest(user.id, target.id);
  if (!result) {
    return withCors(NextResponse.json({ error: "Не удалось отправить запрос." }, { status: 400 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
