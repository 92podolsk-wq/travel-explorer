"use client";

import { motion } from "framer-motion";
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

const screenTransition = { type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] } as const;

export function AppShellRouter({ placeholderSiteSettings }: AppShellRouterProps) {
  const { screen } = useShellNavigation();
  const isMap = screen === "map";

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Both screens stay mounted so the map (and its WebGL context) never
          reloads when switching to Route/Saved/Profile and back. */}
      <motion.div
        className="absolute inset-0"
        style={{ pointerEvents: isMap ? "auto" : "none" }}
        animate={{ x: isMap ? "0%" : "-25%", opacity: isMap ? 1 : 0 }}
        transition={screenTransition}
        aria-hidden={!isMap}
        inert={!isMap || undefined}
      >
        <ExplorerPage
          initialPois={emptyPois}
          initialRegions={emptyRegions}
          initialCountries={emptyCountries}
          initialAreas={emptyAreas}
          initialExplorationModes={emptyExplorationModes}
          initialCategories={emptyCategories}
          initialSiteSettings={placeholderSiteSettings}
        />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{ pointerEvents: isMap ? "none" : "auto" }}
        animate={{ x: isMap ? "100%" : "0%", opacity: isMap ? 0 : 1 }}
        transition={screenTransition}
        aria-hidden={isMap}
        inert={isMap || undefined}
      >
        <AccountPage
          isEmbedded
          initialPois={emptyPois}
          initialRegions={emptyRegions}
          initialCountries={emptyCountries}
          initialAreas={emptyAreas}
          initialSiteSettings={placeholderSiteSettings}
        />
      </motion.div>
    </div>
  );
}
