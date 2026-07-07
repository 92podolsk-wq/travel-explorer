import { ExplorerPage } from "@/views/explorer";
import { readAreas } from "@/shared/server/areas-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readPois } from "@/shared/server/pois-repository";
import { readRegions } from "@/shared/server/regions-repository";

export default function Home() {
  const pois = readPois();
  const regions = readRegions();
  const countries = readCountries();
  const areas = readAreas();

  return (
    <ExplorerPage
      initialPois={pois}
      initialRegions={regions}
      initialCountries={countries}
      initialAreas={areas}
    />
  );
}
