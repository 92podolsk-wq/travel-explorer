import { NextResponse } from "next/server";
import type { CustomMarkerInput } from "@/entities/custom-marker/model/types";
import { CustomMarkerLimitError, createCustomMarker, listCustomMarkers } from "@/shared/server/custom-markers-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";
import { getCurrentUser } from "@/shared/server/user-auth";
import { corsPreflight, withCors } from "@/shared/server/cors";

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const [markers, settings] = await Promise.all([listCustomMarkers(user.id), getSiteSettings()]);
  return withCors(NextResponse.json({ markers, limit: settings.maxCustomMarkersPerUser }), request);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return withCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), request);
  }

  const { lat, lng, color, label } = (await request.json()) as Partial<CustomMarkerInput>;

  if (typeof lat !== "number" || typeof lng !== "number" || !color) {
    return withCors(NextResponse.json({ error: "Invalid marker data" }, { status: 400 }), request);
  }

  try {
    const marker = await createCustomMarker(user.id, { lat, lng, color, label });
    return withCors(NextResponse.json(marker, { status: 201 }), request);
  } catch (error) {
    if (error instanceof CustomMarkerLimitError) {
      const settings = await getSiteSettings();
      return withCors(
        NextResponse.json({ error: "MARKER_LIMIT_REACHED", limit: settings.maxCustomMarkersPerUser }, { status: 400 }),
        request
      );
    }
    throw error;
  }
}
