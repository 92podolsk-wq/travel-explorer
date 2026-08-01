import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { createPoiReport } from "@/shared/server/poi-reports-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { poiId, message } = (await request.json()) as { poiId?: string; message?: string };

  if (!poiId || !message?.trim()) {
    return withCors(NextResponse.json({ error: "Укажите описание неточности." }, { status: 400 }), request);
  }

  await createPoiReport(user.id, poiId, message.trim());

  return withCors(NextResponse.json({ success: true }, { status: 201 }), request);
}
