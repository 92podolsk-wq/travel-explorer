import { NextResponse } from "next/server";
import { findUserByEmail } from "@/shared/server/users-repository";
import { createUserSession, verifyPassword } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";
import { isUserOnline } from "@/shared/server/realtime";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return withCors(NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 }), request);
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (!existing || !existing.passwordHash || !(await verifyPassword(password, existing.passwordHash))) {
    return withCors(NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 }), request);
  }

  if (existing.isBlocked) {
    return withCors(NextResponse.json({ error: "Этот аккаунт заблокирован." }, { status: 403 }), request);
  }

  const { token } = await createUserSession(existing.id);

  return withCors(
    NextResponse.json({
      user: {
        id: existing.id,
        email: existing.email,
        username: existing.username,
        name: existing.name,
        avatarId: existing.avatarId,
        hideFromSearch: existing.hideFromSearch,
        createdAt: existing.createdAt.toISOString(),
        lastSeenAt: existing.lastSeenAt ? existing.lastSeenAt.toISOString() : null,
        isOnline: isUserOnline(existing.id)
      },
      token
    }),
    request
  );
}
