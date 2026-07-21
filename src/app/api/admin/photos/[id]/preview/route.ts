import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { readPendingPhotoFile } from "@/shared/server/photo-storage";
import { prisma } from "@/shared/server/prisma-client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photo = await prisma.photo.findUnique({ where: { id }, select: { status: true, storagePath: true } });

  if (!photo || photo.status !== "pending" || !photo.storagePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await readPendingPhotoFile(photo.storagePath);
  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" }
  });
}
