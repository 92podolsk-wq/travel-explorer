import { Flame, Footprints, Mountain } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Difficulty } from "@/entities/poi/model/types";

export const difficultyIcons: Record<Difficulty, LucideIcon> = {
  easy: Footprints,
  moderate: Mountain,
  active: Flame
};
