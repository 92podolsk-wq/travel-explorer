import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { permanentlyDeletePoi, restorePoi } from "@/shared/server/pois-repository";

type RouteParams = { params: Promise<{ id: string }> };

// Restore a soft-deleted location back into the active list.
export async function POST(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const restored = await restorePoi(id);

  if (!restored) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// Permanently erase a location from the trash — cannot be undone.
export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const removed = await permanentlyDeletePoi(id);

  if (!removed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
