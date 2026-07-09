import { NextResponse } from "next/server";
import type { Season } from "@/entities/poi/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deletePhoto, updatePhoto } from "@/shared/server/photos-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { alt, author, season } = (await request.json()) as {
    alt?: string;
    author?: string | null;
    season?: Season | null;
  };

  const success = await updatePhoto(id, { alt, author, season });
  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = await deletePhoto(id);

  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
