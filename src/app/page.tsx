import { ExplorerPage } from "@/views/explorer";
import { readPois } from "@/shared/server/pois-repository";

export default function Home() {
  const pois = readPois();

  return <ExplorerPage initialPois={pois} />;
}
