import { NextResponse } from "next/server";
import { createAdminSession, verifyAdminPassword } from "@/shared/server/admin-auth";
import { findAdminByEmail } from "@/shared/server/admin-accounts-repository";

export async function POST(request: Request) {
  const { email, password } = (await request.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  const admin = await findAdminByEmail(email);
  if (!admin || !(await verifyAdminPassword(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Неверный email или пароль." }, { status: 401 });
  }

  await createAdminSession(admin.id);

  return NextResponse.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
}
