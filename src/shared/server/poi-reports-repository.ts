import type { PoiReport, PoiReportStatus } from "@/entities/poi-report/model/types";
import { prisma } from "./prisma-client";

type ReportRow = Awaited<
  ReturnType<
    typeof prisma.poiReport.findFirstOrThrow<{
      include: { poi: { select: { name: true; regionId: true } }; user: { select: { email: true; name: true } } };
    }>
  >
>;

function toReport(row: ReportRow): PoiReport {
  return {
    id: row.id,
    poiId: row.poiId,
    poiName: row.poi.name,
    regionId: row.poi.regionId,
    userId: row.userId,
    userEmail: row.user.email,
    userName: row.user.name,
    message: row.message,
    status: row.status as PoiReportStatus,
    createdAt: row.createdAt.toISOString()
  };
}

export async function createPoiReport(userId: string, poiId: string, message: string): Promise<void> {
  await prisma.poiReport.create({ data: { userId, poiId, message } });
}

export async function listPoiReports(): Promise<PoiReport[]> {
  const rows = await prisma.poiReport.findMany({
    include: { poi: { select: { name: true, regionId: true } }, user: { select: { email: true, name: true } } },
    orderBy: { createdAt: "desc" }
  });
  return rows.map(toReport);
}

export async function updatePoiReportStatus(id: string, status: PoiReportStatus): Promise<boolean> {
  const existing = await prisma.poiReport.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  await prisma.poiReport.update({ where: { id }, data: { status } });
  return true;
}

export async function deletePoiReport(id: string): Promise<boolean> {
  try {
    await prisma.poiReport.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
