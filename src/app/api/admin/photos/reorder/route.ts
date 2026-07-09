import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { reorderPhotos } from "@/shared/server/photos-repository";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId, orderedIds } = (await request.json()) as { poiId?: string; orderedIds?: string[] };

  if (!poiId || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "poiId and orderedIds are required" }, { status: 400 });
  }

  const success = await reorderPhotos(poiId, orderedIds);
  if (!success) {
    return NextResponse.json({ error: "Invalid photo list" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
