import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { deleteUser, setUserBlocked, setUserHiddenCategoryAccess } from "@/shared/server/users-repository";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { isBlocked, canAccessHiddenCategories } = (await request.json()) as {
    isBlocked?: boolean;
    canAccessHiddenCategories?: boolean;
  };

  if (typeof isBlocked === "boolean") {
    const updated = await setUserBlocked(id, isBlocked);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  if (typeof canAccessHiddenCategories === "boolean") {
    const updated = await setUserHiddenCategoryAccess(id, canAccessHiddenCategories);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "isBlocked or canAccessHiddenCategories must be a boolean" }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const success = await deleteUser(id);

  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
