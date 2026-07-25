import { Building2, Castle, Church, Eye, FerrisWheel, Flower2, Gem, Landmark, Trees, University } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PoiMainCategory } from "@/entities/poi/model/types";

export const categoryIcons: Record<PoiMainCategory, LucideIcon> = {
  nature: Trees,
  temples: Church,
  castles: Castle,
  museums: University,
  urban: Building2,
  viewpoints: Eye,
  entertainment: FerrisWheel,
  gardens: Flower2,
  monuments: Landmark,
  unique: Gem
};
