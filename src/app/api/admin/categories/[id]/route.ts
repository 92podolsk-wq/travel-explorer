import { NextResponse } from "next/server";
import type { CategoryInput } from "@/entities/category/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteCategory, updateCategory } from "@/shared/server/categories-repository";

type RouteParams = { params: Promise<{ id: string }> };

function inUseMessage(placeCount: number) {
  return `Нельзя изменить: за этой категорией закреплено локаций — ${placeCount}. Сначала перенесите их в другую категорию.`;
}

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const input = (await request.json()) as CategoryInput;
  const result = await updateCategory(id, input);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ error: inUseMessage(result.placeCount) }, { status: 409 });
  }

  return NextResponse.json(result.category);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await deleteCategory(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Нельзя удалить: за этой категорией закреплено локаций — ${result.placeCount}.` },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
