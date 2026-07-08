import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { clearFavorites } from "@/shared/server/user-pois-repository";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearFavorites(user.id);

  return NextResponse.json({ success: true });
}
