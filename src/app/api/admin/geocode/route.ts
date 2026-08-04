import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: [string, string, string, string];
};

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=5&accept-language=ru,en&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Wayora-TravelExplorer-Admin/1.0 (+https://wayora.ru)" },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
    }

    const data = (await response.json()) as NominatimResult[];
    const results = data.map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      ...(item.boundingbox
        ? {
            bounds: {
              swLat: Number(item.boundingbox[0]),
              neLat: Number(item.boundingbox[1]),
              swLng: Number(item.boundingbox[2]),
              neLng: Number(item.boundingbox[3])
            }
          }
        : {})
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 502 });
  }
}
