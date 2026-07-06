import { Flower2, Leaf, Snowflake, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Season } from "@/entities/poi/model/types";

export const seasonIcons: Record<Season, LucideIcon> = {
  spring: Flower2,
  summer: Sun,
  autumn: Leaf,
  winter: Snowflake
};
