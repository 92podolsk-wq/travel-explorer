import { Building2, Church, Eye, Flower2, Landmark, Route, ShoppingBasket, Trees, University } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PoiCategory } from "@/entities/poi/model/types";

export const categoryIcons: Record<PoiCategory, LucideIcon> = {
  temple: Landmark,
  shrine: Church,
  garden: Flower2,
  street: Route,
  district: Building2,
  nature: Trees,
  viewpoint: Eye,
  market: ShoppingBasket,
  museum: University
};
