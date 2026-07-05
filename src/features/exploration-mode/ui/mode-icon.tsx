import { Camera, Compass, Flower2, Gem, Leaf, TreeDeciduous } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";

export const modeIcons: Record<ExplorationModeId, LucideIcon> = {
  photographer: Camera,
  "first-visit": Compass,
  nature: Leaf,
  autumn: TreeDeciduous,
  sakura: Flower2,
  "hidden-gems": Gem
};
