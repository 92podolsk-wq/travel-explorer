import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { registerPushToken, unregisterPushToken } from "@/shared/server/push-notifications";

export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  await registerPushToken(token, currentUser?.id ?? null);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  await unregisterPushToken(token);

  return NextResponse.json({ success: true });
}
