import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { listChecklistsSharedWithMe } from "@/shared/server/checklist-shares-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const checklists = await listChecklistsSharedWithMe(user.id);
  return withCors(NextResponse.json({ checklists }), request);
}
