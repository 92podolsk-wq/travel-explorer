import { NextResponse } from "next/server";
import type { ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { createExplorationMode, readExplorationModes } from "@/shared/server/exploration-modes-repository";

export async function GET() {
  return NextResponse.json(await readExplorationModes());
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = (await request.json()) as ExplorationModeInput;
  const mode = await createExplorationMode(input);

  return NextResponse.json(mode, { status: 201 });
}
