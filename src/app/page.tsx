import { ExplorerPage } from "@/views/explorer";
import { readAreas } from "@/shared/server/areas-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readExplorationModes } from "@/shared/server/exploration-modes-repository";
import { readPublishedPois } from "@/shared/server/pois-repository";
import { readPublishedRegions } from "@/shared/server/regions-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pois, regions, countries, areas, explorationModes, siteSettings] = await Promise.all([
    readPublishedPois(),
    readPublishedRegions(),
    readCountries(),
    readAreas(),
    readExplorationModes(),
    getSiteSettings()
  ]);

  return (
    <ExplorerPage
      initialPois={pois}
      initialRegions={regions}
      initialCountries={countries}
      initialAreas={areas}
      initialExplorationModes={explorationModes}
      initialSiteSettings={siteSettings}
    />
  );
}
