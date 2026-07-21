import { NextResponse } from "next/server";
import type { CustomMarkerInput } from "@/entities/custom-marker/model/types";
import { CustomMarkerLimitError, createCustomMarker, listCustomMarkers } from "@/shared/server/custom-markers-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [markers, settings] = await Promise.all([listCustomMarkers(user.id), getSiteSettings()]);
  return NextResponse.json({ markers, limit: settings.maxCustomMarkersPerUser });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lat, lng, color, label } = (await request.json()) as Partial<CustomMarkerInput>;

  if (typeof lat !== "number" || typeof lng !== "number" || !color) {
    return NextResponse.json({ error: "Invalid marker data" }, { status: 400 });
  }

  try {
    const marker = await createCustomMarker(user.id, { lat, lng, color, label });
    return NextResponse.json(marker, { status: 201 });
  } catch (error) {
    if (error instanceof CustomMarkerLimitError) {
      const settings = await getSiteSettings();
      return NextResponse.json({ error: "MARKER_LIMIT_REACHED", limit: settings.maxCustomMarkersPerUser }, { status: 400 });
    }
    throw error;
  }
}
