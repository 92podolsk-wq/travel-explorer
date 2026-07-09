import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";
import { readAreas } from "@/shared/server/areas-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readExplorationModes } from "@/shared/server/exploration-modes-repository";
import { readPois } from "@/shared/server/pois-repository";
import { readRegions } from "@/shared/server/regions-repository";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [countries, areas, regions, pois, explorationModes] = await Promise.all([
    readCountries(),
    readAreas(),
    readRegions(),
    readPois(),
    readExplorationModes()
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    countries,
    areas,
    regions,
    pois,
    explorationModes
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="travel-explorer-backup-${new Date().toISOString().slice(0, 10)}.json"`
    }
  });
}
