import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { findUserByUsername, updateUserProfile } from "@/shared/server/users-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { name, username } = (await request.json()) as { name?: string; username?: string };

  const normalizedUsername = username?.trim().toLowerCase() ?? "";
  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return withCors(
      NextResponse.json(
        { error: "Логин должен содержать 3-20 символов: латинские буквы, цифры или подчёркивание." },
        { status: 400 }
      ),
      request
    );
  }

  if (normalizedUsername !== user.username) {
    const existing = await findUserByUsername(normalizedUsername);
    if (existing) {
      return withCors(NextResponse.json({ error: "Этот логин уже занят." }, { status: 409 }), request);
    }
  }

  const updated = await updateUserProfile(user.id, { name: name?.trim() || null, username: normalizedUsername });
  if (!updated) {
    return withCors(NextResponse.json({ error: "Этот логин уже занят." }, { status: 409 }), request);
  }

  return withCors(NextResponse.json({ user: updated }), request);
}
