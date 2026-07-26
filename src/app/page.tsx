import { ExplorerPage } from "@/views/explorer";
import { readAreas } from "@/shared/server/areas-repository";
import { readCategories } from "@/shared/server/categories-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readExplorationModes } from "@/shared/server/exploration-modes-repository";
import { readPublishedPois } from "@/shared/server/pois-repository";
import { readPublishedRegions } from "@/shared/server/regions-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";
import { getCurrentUser } from "@/shared/server/user-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pois, regions, countries, areas, explorationModes, categories, siteSettings, currentUser] = await Promise.all([
    readPublishedPois(),
    readPublishedRegions(),
    readCountries(),
    readAreas(),
    readExplorationModes(),
    readCategories(),
    getSiteSettings(),
    getCurrentUser()
  ]);
  const visibleCategories = currentUser?.canAccessHiddenCategories
    ? categories
    : categories.filter((category) => !category.isHidden);
  const hiddenCategoryIds = new Set(
    categories.filter((category) => category.isHidden).map((category) => category.id)
  );
  const visiblePois = currentUser?.canAccessHiddenCategories
    ? pois
    : pois.filter((poi) => !hiddenCategoryIds.has(poi.category));

  return (
    <ExplorerPage
      initialPois={visiblePois}
      initialRegions={regions}
      initialCountries={countries}
      initialAreas={areas}
      initialExplorationModes={explorationModes}
      initialCategories={visibleCategories}
      initialSiteSettings={siteSettings}
    />
  );
}
