import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminAuthenticated() });
}
