import { NextResponse } from "next/server";
import { deleteCustomMarker } from "@/shared/server/custom-markers-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

type RouteParams = { params: Promise<{ id: string }> };

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { id } = await params;
  const deleted = await deleteCustomMarker(user.id, id);
  if (!deleted) {
    return withCors(NextResponse.json({ error: "Marker not found" }, { status: 404 }), request);
  }

  return withCors(NextResponse.json({ ok: true }), request);
}
