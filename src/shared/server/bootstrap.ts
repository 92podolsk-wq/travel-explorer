import { readAreas } from "./areas-repository";
import { readCategories } from "./categories-repository";
import { readCountries } from "./countries-repository";
import { readExplorationModes } from "./exploration-modes-repository";
import { readPublishedPois } from "./pois-repository";
import { readPublishedRegions } from "./regions-repository";
import { getSiteSettings } from "./site-settings-repository";
import { getCurrentUser } from "./user-auth";

export async function getBootstrapData() {
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

  return {
    pois: visiblePois,
    regions,
    countries,
    areas,
    explorationModes,
    categories: visibleCategories,
    siteSettings
  };
}
