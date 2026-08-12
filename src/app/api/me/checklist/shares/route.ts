import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { listChecklistShareTargets, shareChecklist } from "@/shared/server/checklist-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const targets = await listChecklistShareTargets(user.id);
  return withCors(NextResponse.json({ users: targets }), request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { friendUserId } = (await request.json()) as { friendUserId?: string };
  if (!friendUserId) {
    return withCors(NextResponse.json({ error: "friendUserId is required" }, { status: 400 }), request);
  }

  const shared = await shareChecklist(user.id, friendUserId);
  if (!shared) {
    return withCors(NextResponse.json({ error: "Можно делиться только с друзьями." }, { status: 403 }), request);
  }

  return withCors(NextResponse.json({ success: true }), request);
}
