import { NextResponse } from "next/server";
import { clearUserSession } from "@/shared/server/user-auth";

export async function POST() {
  await clearUserSession();
  return NextResponse.json({ success: true });
}
