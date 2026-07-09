import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteAdminAccount, updateAdminAccount } from "@/shared/server/admin-accounts-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, email, password } = (await request.json()) as { name?: string; email?: string; password?: string };

  if (password !== undefined && password.length > 0 && password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не менее 8 символов." }, { status: 400 });
  }

  const result = await updateAdminAccount(id, {
    name: name?.trim() || undefined,
    email: email?.trim() || undefined,
    password: password || undefined
  });

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Администратор с таким email уже существует." }, { status: 409 });
  }

  return NextResponse.json(result.account);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteAdminAccount(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Нельзя удалить последнего администратора." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
