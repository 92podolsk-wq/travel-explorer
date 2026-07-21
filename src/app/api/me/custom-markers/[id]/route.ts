import { NextResponse } from "next/server";
import { deleteCustomMarker } from "@/shared/server/custom-markers-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteCustomMarker(user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: "Marker not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
