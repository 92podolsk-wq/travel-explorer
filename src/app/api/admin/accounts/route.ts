import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createAdminAccount, listAdminAccounts } from "@/shared/server/admin-accounts-repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await listAdminAccounts());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password } = (await request.json()) as { name?: string; email?: string; password?: string };

  if (!name?.trim() || !email?.trim() || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Укажите имя, email и пароль (не менее 8 символов)." },
      { status: 400 }
    );
  }

  const result = await createAdminAccount(name.trim(), email.trim(), password);
  if (!result.success) {
    return NextResponse.json({ error: "Администратор с таким email уже существует." }, { status: 409 });
  }

  return NextResponse.json(result.account, { status: 201 });
}
