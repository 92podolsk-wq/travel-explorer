import type { CustomMarker, CustomMarkerInput } from "@/entities/custom-marker/model/types";
import { getSiteSettings } from "./site-settings-repository";
import { prisma } from "./prisma-client";

export class CustomMarkerLimitError extends Error {}

type CustomMarkerRow = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  label: string;
  createdAt: Date;
};

export function toCustomMarker(row: CustomMarkerRow): CustomMarker {
  return {
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    color: row.color,
    label: row.label,
    createdAt: row.createdAt.toISOString()
  };
}

export async function listCustomMarkers(userId: string): Promise<CustomMarker[]> {
  const rows = await prisma.customMarker.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return rows.map(toCustomMarker);
}

export async function createCustomMarker(userId: string, input: CustomMarkerInput): Promise<CustomMarker> {
  const [settings, count] = await Promise.all([
    getSiteSettings(),
    prisma.customMarker.count({ where: { userId } })
  ]);

  if (count >= settings.maxCustomMarkersPerUser) {
    throw new CustomMarkerLimitError();
  }

  const row = await prisma.customMarker.create({
    data: {
      userId,
      lat: input.lat,
      lng: input.lng,
      color: input.color,
      label: input.label?.trim() ?? ""
    }
  });

  return toCustomMarker(row);
}

export async function deleteCustomMarker(userId: string, id: string): Promise<boolean> {
  const owned = await prisma.customMarker.findUnique({ where: { id }, select: { userId: true } });
  if (!owned || owned.userId !== userId) {
    return false;
  }

  await prisma.customMarker.delete({ where: { id } });
  return true;
}
