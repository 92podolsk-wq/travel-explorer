import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/shared/server/users-repository";
import { createUserSession, hashPassword } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const { email, password, name } = (await request.json()) as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Укажите email и пароль (не менее 8 символов)." },
      { status: 400 }
    );
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email.toLowerCase(), passwordHash, name?.trim() || null);
  await createUserSession(user.id);

  return NextResponse.json({ user }, { status: 201 });
}
