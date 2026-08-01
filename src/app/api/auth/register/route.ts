import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/shared/server/users-repository";
import { createUserSession, hashPassword } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const { email, password, name } = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || password.length < 8) {
    return withCors(
      NextResponse.json({ error: "Укажите email и пароль (не менее 8 символов)." }, { status: 400 }),
      request
    );
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    return withCors(
      NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован." }, { status: 409 }),
      request
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email.toLowerCase(), passwordHash, name?.trim() || null);
  const { token } = await createUserSession(user.id);

  return withCors(NextResponse.json({ user, token }, { status: 201 }), request);
}
