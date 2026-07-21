import { mapStyleIds, type MapStyleId, type SiteSettings, type SiteSettingsInput } from "@/entities/site-setting/model/types";
import { prisma } from "./prisma-client";

const singletonId = "singleton";

function toMapStyleId(value: string): MapStyleId {
  return (mapStyleIds as readonly string[]).includes(value) ? (value as MapStyleId) : "openfreemap-bright";
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { id: singletonId } });

  if (!row) {
    return { mapStyleId: "openfreemap-bright", protomapsPmtilesUrl: null, maxCustomMarkersPerUser: 200 };
  }

  return {
    mapStyleId: toMapStyleId(row.mapStyleId),
    protomapsPmtilesUrl: row.protomapsPmtilesUrl,
    maxCustomMarkersPerUser: row.maxCustomMarkersPerUser
  };
}

export async function updateSiteSettings(input: SiteSettingsInput): Promise<SiteSettings> {
  const row = await prisma.siteSetting.upsert({
    where: { id: singletonId },
    create: {
      id: singletonId,
      mapStyleId: input.mapStyleId,
      protomapsPmtilesUrl: input.protomapsPmtilesUrl ?? null,
      maxCustomMarkersPerUser: input.maxCustomMarkersPerUser
    },
    update: {
      mapStyleId: input.mapStyleId,
      protomapsPmtilesUrl: input.protomapsPmtilesUrl ?? null,
      maxCustomMarkersPerUser: input.maxCustomMarkersPerUser
    }
  });

  return {
    mapStyleId: toMapStyleId(row.mapStyleId),
    protomapsPmtilesUrl: row.protomapsPmtilesUrl,
    maxCustomMarkersPerUser: row.maxCustomMarkersPerUser
  };
}
