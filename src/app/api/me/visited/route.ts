import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { clearVisited } from "@/shared/server/user-pois-repository";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearVisited(user.id);

  return NextResponse.json({ success: true });
}
