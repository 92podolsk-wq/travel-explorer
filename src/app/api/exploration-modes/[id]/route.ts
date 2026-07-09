import { NextResponse } from "next/server";
import type { ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteExplorationMode, updateExplorationMode } from "@/shared/server/exploration-modes-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const input = (await request.json()) as ExplorationModeInput;
  const updated = await updateExplorationMode(id, input);

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
  const result = await deleteExplorationMode(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Нельзя удалить последний оставшийся режим." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
