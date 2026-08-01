import { NextResponse } from "next/server";
import { createDeviceToken, getCurrentUser, revokeSessionToken } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

// Mints an extra session token for a user already authenticated via the
// cookie (called from a wayora.ru page inside the native app) so the local
// app-shell origin can later authenticate the same user cross-origin.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const token = await createDeviceToken(user.id);

  return withCors(NextResponse.json({ token }), request);
}

export async function DELETE(request: Request) {
  const { token } = (await request.json().catch(() => ({}))) as { token?: string };

  if (token) {
    await revokeSessionToken(token);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
