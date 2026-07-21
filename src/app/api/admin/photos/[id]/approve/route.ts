import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { PhotoNotPendingError, approvePhoto } from "@/shared/server/photos-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const success = await approvePhoto(id);
    if (success === null) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PhotoNotPendingError) {
      return NextResponse.json({ error: "Photo is not pending" }, { status: 400 });
    }
    throw error;
  }
}
