import { NextResponse } from "next/server";
import type { PoiInput } from "@/entities/poi/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createPoi, readPois } from "@/shared/server/pois-repository";

export async function GET() {
  return NextResponse.json(readPois());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as PoiInput;
  const poi = createPoi(input);

  return NextResponse.json(poi, { status: 201 });
}
