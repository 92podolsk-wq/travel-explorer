import { ExplorerPage } from "@/views/explorer";
import { readAreas } from "@/shared/server/areas-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readPois } from "@/shared/server/pois-repository";
import { readRegions } from "@/shared/server/regions-repository";

export default async function Home() {
  const [pois, regions, countries, areas] = await Promise.all([
    readPois(),
    readRegions(),
    readCountries(),
    readAreas()
  ]);

  return (
    <ExplorerPage
      initialPois={pois}
      initialRegions={regions}
      initialCountries={countries}
      initialAreas={areas}
    />
  );
}
