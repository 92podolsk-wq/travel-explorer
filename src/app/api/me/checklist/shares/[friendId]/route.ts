import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { unshareChecklist } from "@/shared/server/checklist-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ friendId: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { friendId } = await params;
  const removed = await unshareChecklist(user.id, friendId);
  if (!removed) {
    return withCors(NextResponse.json({ error: "Not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
