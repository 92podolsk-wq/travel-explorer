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

  const { mapStyleId, protomapsPmtilesUrl, maxCustomMarkersPerUser, maxPhotoUploadsPerUserPerDay, maxPhotoUploadsSiteWidePerDay } =
    (await request.json()) as {
      mapStyleId?: string;
      protomapsPmtilesUrl?: string | null;
      maxCustomMarkersPerUser?: number;
      maxPhotoUploadsPerUserPerDay?: number;
      maxPhotoUploadsSiteWidePerDay?: number;
    };

  if (!mapStyleId || !(mapStyleIds as readonly string[]).includes(mapStyleId)) {
    return NextResponse.json({ error: "Неизвестный стиль карты." }, { status: 400 });
  }

  if (
    maxCustomMarkersPerUser == null ||
    !Number.isInteger(maxCustomMarkersPerUser) ||
    maxCustomMarkersPerUser < 0 ||
    maxCustomMarkersPerUser > 5000
  ) {
    return NextResponse.json({ error: "Лимит меток должен быть целым числом от 0 до 5000." }, { status: 400 });
  }

  if (
    maxPhotoUploadsPerUserPerDay == null ||
    !Number.isInteger(maxPhotoUploadsPerUserPerDay) ||
    maxPhotoUploadsPerUserPerDay < 0 ||
    maxPhotoUploadsPerUserPerDay > 100
  ) {
    return NextResponse.json({ error: "Лимит фото на пользователя в сутки должен быть целым числом от 0 до 100." }, { status: 400 });
  }

  if (
    maxPhotoUploadsSiteWidePerDay == null ||
    !Number.isInteger(maxPhotoUploadsSiteWidePerDay) ||
    maxPhotoUploadsSiteWidePerDay < 0 ||
    maxPhotoUploadsSiteWidePerDay > 10000
  ) {
    return NextResponse.json({ error: "Общий лимит фото в сутки должен быть целым числом от 0 до 10000." }, { status: 400 });
  }

  const updated = await updateSiteSettings({
    mapStyleId: mapStyleId as MapStyleId,
    protomapsPmtilesUrl: protomapsPmtilesUrl?.trim() || null,
    maxCustomMarkersPerUser,
    maxPhotoUploadsPerUserPerDay,
    maxPhotoUploadsSiteWidePerDay
  });

  return NextResponse.json(updated);
}
