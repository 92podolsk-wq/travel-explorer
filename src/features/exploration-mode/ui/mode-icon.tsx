import {
  Camera,
  Compass,
  Flower2,
  Footprints,
  Heart,
  Landmark,
  Leaf,
  MapPin,
  Moon,
  Mountain,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  TreeDeciduous,
  Umbrella,
  Utensils,
  Waves
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const modeIconOptions = [
  { key: "camera", icon: Camera, label: "Камера" },
  { key: "compass", icon: Compass, label: "Компас" },
  { key: "leaf", icon: Leaf, label: "Лист" },
  { key: "tree", icon: TreeDeciduous, label: "Дерево" },
  { key: "flower", icon: Flower2, label: "Цветок" },
  { key: "mountain", icon: Mountain, label: "Гора" },
  { key: "sun", icon: Sun, label: "Солнце" },
  { key: "moon", icon: Moon, label: "Луна" },
  { key: "umbrella", icon: Umbrella, label: "Дождь" },
  { key: "map-pin", icon: MapPin, label: "Метка" },
  { key: "star", icon: Star, label: "Звезда" },
  { key: "sparkles", icon: Sparkles, label: "Искры" },
  { key: "heart", icon: Heart, label: "Сердце" },
  { key: "food", icon: Utensils, label: "Еда" },
  { key: "shopping", icon: ShoppingBag, label: "Покупки" },
  { key: "footprints", icon: Footprints, label: "Прогулка" },
  { key: "waves", icon: Waves, label: "Вода" },
  { key: "landmark", icon: Landmark, label: "Достопримечательность" }
] as const satisfies ReadonlyArray<{ key: string; icon: LucideIcon; label: string }>;

const modeIconMap: Record<string, LucideIcon> = Object.fromEntries(
  modeIconOptions.map((option) => [option.key, option.icon])
);

export const defaultModeIcon: LucideIcon = Sparkles;

export function getModeIcon(key: string): LucideIcon {
  return modeIconMap[key] ?? defaultModeIcon;
}
