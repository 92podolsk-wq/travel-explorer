import { createElement } from "react";
import {
  Anchor,
  Bird,
  Building2,
  Camera,
  Castle,
  Church,
  Compass,
  Eye,
  FerrisWheel,
  Fish,
  Flame,
  Flower2,
  Footprints,
  Gem,
  Heart,
  Landmark,
  MapPin,
  Mountain,
  Palette,
  Ship,
  Sparkles,
  Star,
  Sun,
  Trees,
  Trophy,
  Umbrella,
  University,
  Utensils,
  Waves
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// A handful of category icons are real brand logos (raster images) rather
// than line-art glyphs, so they can't come from the lucide set below. This
// wraps an image path in a component with the same {className, size} shape
// lucide icons expose, so every existing render call site keeps working
// unchanged.
const imageIconPaths: Record<string, string> = {
  bookoff: "/category-icons/bookoff.png"
};

function makeImageIcon(src: string): LucideIcon {
  function ImageIcon({ className, size = 24 }: { className?: string; size?: number | string }) {
    return createElement("img", {
      src,
      alt: "",
      className,
      style: { width: size, height: size, borderRadius: "9999px", objectFit: "cover", display: "inline-block" }
    });
  }
  return ImageIcon as unknown as LucideIcon;
}

export const categoryIconOptions = [
  { key: "trees", icon: Trees, label: "Деревья" },
  { key: "church", icon: Church, label: "Храм" },
  { key: "castle", icon: Castle, label: "Замок" },
  { key: "university", icon: University, label: "Музей" },
  { key: "building", icon: Building2, label: "Здание" },
  { key: "eye", icon: Eye, label: "Смотровая площадка" },
  { key: "ferris-wheel", icon: FerrisWheel, label: "Колесо обозрения" },
  { key: "flower", icon: Flower2, label: "Цветок" },
  { key: "landmark", icon: Landmark, label: "Памятник" },
  { key: "gem", icon: Gem, label: "Драгоценность" },
  { key: "camera", icon: Camera, label: "Камера" },
  { key: "compass", icon: Compass, label: "Компас" },
  { key: "mountain", icon: Mountain, label: "Гора" },
  { key: "sun", icon: Sun, label: "Солнце" },
  { key: "umbrella", icon: Umbrella, label: "Дождь" },
  { key: "map-pin", icon: MapPin, label: "Метка" },
  { key: "star", icon: Star, label: "Звезда" },
  { key: "sparkles", icon: Sparkles, label: "Искры" },
  { key: "heart", icon: Heart, label: "Сердце" },
  { key: "food", icon: Utensils, label: "Еда" },
  { key: "footprints", icon: Footprints, label: "Прогулка" },
  { key: "waves", icon: Waves, label: "Вода" },
  { key: "anchor", icon: Anchor, label: "Порт" },
  { key: "ship", icon: Ship, label: "Корабль" },
  { key: "palette", icon: Palette, label: "Искусство" },
  { key: "trophy", icon: Trophy, label: "Спорт" },
  { key: "flame", icon: Flame, label: "Огонь" },
  { key: "bird", icon: Bird, label: "Птицы" },
  { key: "fish", icon: Fish, label: "Рыбалка" },
  { key: "bookoff", icon: makeImageIcon(imageIconPaths.bookoff), label: "BookOff" }
] as const satisfies ReadonlyArray<{ key: string; icon: LucideIcon; label: string }>;

const categoryIconMap: Record<string, LucideIcon> = Object.fromEntries(
  categoryIconOptions.map((option) => [option.key, option.icon])
);

export const defaultCategoryIcon: LucideIcon = Gem;

export function getCategoryIconComponent(iconKey: string): LucideIcon {
  if (imageIconPaths[iconKey]) return makeImageIcon(imageIconPaths[iconKey]);
  return categoryIconMap[iconKey] ?? defaultCategoryIcon;
}

export function getCategoryImageIconPath(iconKey: string): string | null {
  return imageIconPaths[iconKey] ?? null;
}

export const categoryColorOptions = [
  "#2f8f8a",
  "#d1495b",
  "#a4694a",
  "#6b5b95",
  "#5b6ee1",
  "#e0a13e",
  "#c1440e",
  "#4c9a63",
  "#8a7355",
  "#b5651d",
  "#3f7ca8",
  "#9a4c8f",
  "#5a8f3c",
  "#c76b9e"
];

export const defaultCategoryColor = categoryColorOptions[0];
