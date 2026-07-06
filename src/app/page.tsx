import { ExplorerPage } from "@/views/explorer";
import { readPois } from "@/shared/server/pois-repository";
import { readRegions } from "@/shared/server/regions-repository";

export default function Home() {
  const pois = readPois();
  const regions = readRegions();

  return <ExplorerPage initialPois={pois} initialRegions={regions} />;
}
