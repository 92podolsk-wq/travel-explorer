"use client";

import type { Area } from "@/entities/area/model/types";
import type { Category } from "@/entities/category/model/types";
import type { Country } from "@/entities/country/model/types";
import type { ExplorationMode } from "@/entities/exploration-mode/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import type { SiteSettings } from "@/entities/site-setting/model/types";
import { useShellNavigation } from "@/shared/lib/shell-navigation";
import { ExplorerPage } from "@/views/explorer";
import { AccountPage } from "@/views/account";

type AppShellRouterProps = {
  placeholderSiteSettings: SiteSettings;
};

const emptyPois: Poi[] = [];
const emptyRegions: Region[] = [];
const emptyCountries: Country[] = [];
const emptyAreas: Area[] = [];
const emptyExplorationModes: ExplorationMode[] = [];
const emptyCategories: Category[] = [];

export function AppShellRouter({ placeholderSiteSettings }: AppShellRouterProps) {
  const { screen } = useShellNavigation();

  if (screen === "account") {
    return (
      <AccountPage
        isEmbedded
        initialPois={emptyPois}
        initialRegions={emptyRegions}
        initialCountries={emptyCountries}
        initialAreas={emptyAreas}
        initialSiteSettings={placeholderSiteSettings}
      />
    );
  }

  return (
    <ExplorerPage
      initialPois={emptyPois}
      initialRegions={emptyRegions}
      initialCountries={emptyCountries}
      initialAreas={emptyAreas}
      initialExplorationModes={emptyExplorationModes}
      initialCategories={emptyCategories}
      initialSiteSettings={placeholderSiteSettings}
    />
  );
}
