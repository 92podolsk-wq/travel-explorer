import { NextResponse } from "next/server";
import { clearUserSession } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  await clearUserSession();
  return withCors(NextResponse.json({ success: true }), request);
}
