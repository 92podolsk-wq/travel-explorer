import { NextResponse } from "next/server";
import type { AreaInput } from "@/entities/area/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createArea, readAreas } from "@/shared/server/areas-repository";

export async function GET() {
  return NextResponse.json(readAreas());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as AreaInput;
  const area = createArea(input);

  return NextResponse.json(area, { status: 201 });
}
