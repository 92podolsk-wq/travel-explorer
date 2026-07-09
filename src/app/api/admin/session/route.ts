import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/shared/server/admin-auth";

export async function GET() {
  const admin = await getCurrentAdmin();

  return NextResponse.json({
    authenticated: admin !== null,
    admin: admin ? { id: admin.id, name: admin.name, email: admin.email } : null
  });
}
