import { NextResponse } from "next/server";
import { getCurrentUser } from "@/shared/server/user-auth";
import { getOrCreateChecklist, updateChecklist } from "@/shared/server/packing-checklist-repository";
import { corsPreflight, withCors } from "@/shared/server/cors";
import type { PackingChecklist } from "@/entities/checklist/model/types";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const checklist = await getOrCreateChecklist(user.id);
  return withCors(NextResponse.json({ checklist }), request);
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const patch = (await request.json()) as Partial<PackingChecklist>;
  const checklist = await updateChecklist(user.id, patch);
  return withCors(NextResponse.json({ checklist }), request);
}
