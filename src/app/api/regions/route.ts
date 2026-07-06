import { NextResponse } from "next/server";
import type { RegionInput } from "@/entities/region/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createRegion, readRegions } from "@/shared/server/regions-repository";

export async function GET() {
  return NextResponse.json(readRegions());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as RegionInput;
  const region = createRegion(input);

  return NextResponse.json(region, { status: 201 });
}
