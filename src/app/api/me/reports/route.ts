import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { createPoiReport } from "@/shared/server/poi-reports-repository";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { poiId, message } = (await request.json()) as { poiId?: string; message?: string };

  if (!poiId || !message?.trim()) {
    return NextResponse.json({ error: "Укажите описание неточности." }, { status: 400 });
  }

  await createPoiReport(user.id, poiId, message.trim());

  return NextResponse.json({ success: true }, { status: 201 });
}
