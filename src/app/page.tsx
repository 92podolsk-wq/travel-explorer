import { ExplorerPage } from "@/views/explorer";
import { getBootstrapData } from "@/shared/server/bootstrap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getBootstrapData();

  return (
    <ExplorerPage
      initialPois={data.pois}
      initialRegions={data.regions}
      initialCountries={data.countries}
      initialAreas={data.areas}
      initialExplorationModes={data.explorationModes}
      initialCategories={data.categories}
      initialSiteSettings={data.siteSettings}
    />
  );
}
