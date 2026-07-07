import { NextResponse } from "next/server";
import { findUserByEmail } from "@/shared/server/users-repository";
import { createUserSession, verifyPassword } from "@/shared/server/user-auth";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  const existing = await findUserByEmail(email.toLowerCase());
  if (!existing || !(await verifyPassword(password, existing.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
  }

  await createUserSession(existing.id);

  return NextResponse.json({
    user: { id: existing.id, email: existing.email, name: existing.name, createdAt: existing.createdAt.toISOString() }
  });
}
