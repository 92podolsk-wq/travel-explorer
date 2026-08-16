import { NextResponse } from "next/server";
import { setPoiClosedStatus } from "@/shared/server/pois-repository";

type RouteParams = { params: Promise<{ id: string }> };

// Written to by an external scheduled check (not the admin UI), so it uses
// its own bearer secret instead of the admin session cookie.
export async function POST(request: Request, { params }: RouteParams) {
  const secret = process.env.POI_STATUS_SYNC_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.isTemporarilyClosed !== "boolean") {
    return NextResponse.json({ error: "isTemporarilyClosed must be a boolean" }, { status: 400 });
  }

  const { id } = await params;
  const success = await setPoiClosedStatus(id, body.isTemporarilyClosed);
  if (!success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
