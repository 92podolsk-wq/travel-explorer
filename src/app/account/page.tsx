import { AccountPage } from "@/views/account";
import { readAreas } from "@/shared/server/areas-repository";
import { readCountries } from "@/shared/server/countries-repository";
import { readPublishedPois } from "@/shared/server/pois-repository";
import { readPublishedRegions } from "@/shared/server/regions-repository";
import { getSiteSettings } from "@/shared/server/site-settings-repository";

export default async function Account() {
  const [pois, regions, countries, areas, siteSettings] = await Promise.all([
    readPublishedPois(),
    readPublishedRegions(),
    readCountries(),
    readAreas(),
    getSiteSettings()
  ]);

  return (
    <AccountPage
      initialPois={pois}
      initialRegions={regions}
      initialCountries={countries}
      initialAreas={areas}
      initialSiteSettings={siteSettings}
    />
  );
}
