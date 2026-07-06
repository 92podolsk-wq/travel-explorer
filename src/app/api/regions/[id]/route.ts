import { NextResponse } from "next/server";
import type { RegionInput } from "@/entities/region/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteRegion, updateRegion } from "@/shared/server/regions-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const input = (await request.json()) as RegionInput;
  const updated = updateRegion(id, input);

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
  const result = deleteRegion(id);

  if (!result.success) {
    if (result.reason === "not-found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: `Cannot delete: ${result.placeCount} place(s) still assigned to this region.` },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
