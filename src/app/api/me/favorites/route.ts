import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { clearFavorites } from "@/shared/server/user-pois-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  await clearFavorites(user.id);

  return withCors(NextResponse.json({ success: true }), request);
}
