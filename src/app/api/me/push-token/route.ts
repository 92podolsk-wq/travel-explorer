import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { registerPushToken, unregisterPushToken } from "@/shared/server/push-notifications";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return withCors(NextResponse.json({ error: "Missing token" }, { status: 400 }), request);
  }

  const currentUser = await getCurrentUser();
  await registerPushToken(token, currentUser?.id ?? null);

  return withCors(NextResponse.json({ success: true }), request);
}

export async function DELETE(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return withCors(NextResponse.json({ error: "Missing token" }, { status: 400 }), request);
  }

  await unregisterPushToken(token);

  return withCors(NextResponse.json({ success: true }), request);
}
