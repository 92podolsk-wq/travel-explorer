import { NextResponse } from "next/server";
import { mapStyleIds, type MapStyleId } from "@/entities/site-setting/model/types";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { getSiteSettings, updateSiteSettings } from "@/shared/server/site-settings-repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getSiteSettings());
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mapStyleId, protomapsPmtilesUrl } = (await request.json()) as {
    mapStyleId?: string;
    protomapsPmtilesUrl?: string | null;
  };

  if (!mapStyleId || !(mapStyleIds as readonly string[]).includes(mapStyleId)) {
    return NextResponse.json({ error: "Неизвестный стиль карты." }, { status: 400 });
  }

  const updated = await updateSiteSettings({
    mapStyleId: mapStyleId as MapStyleId,
    protomapsPmtilesUrl: protomapsPmtilesUrl?.trim() || null
  });

  return NextResponse.json(updated);
}
