import type { LucideIcon } from "lucide-react";
import type { Category } from "@/entities/category/model/types";
import { getCategoryIconComponent } from "@/entities/category/ui/category-icon-options";

export function getCategoryIcon(categories: Category[], categoryId: string): LucideIcon {
  const category = categories.find((item) => item.id === categoryId);
  return getCategoryIconComponent(category?.icon ?? "");
}
