import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { broadcastPushNotification } from "@/shared/server/push-notifications";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body } = (await request.json()) as { title?: string; body?: string };
  if (!title || !body) {
    return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
  }

  try {
    const result = await broadcastPushNotification(title, body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send broadcast";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
