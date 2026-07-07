import { NextResponse } from "next/server";
import type { AreaInput } from "@/entities/area/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteArea, updateArea } from "@/shared/server/areas-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const input = (await request.json()) as AreaInput;
  const updated = updateArea(id, input);

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = deleteArea(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Не удалось удалить: за этим регионом закреплено городов — ${result.cityCount}.` },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
