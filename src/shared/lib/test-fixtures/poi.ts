import type { Poi } from "@/entities/poi/model/types";

let counter = 0;

export function makePoi(overrides: Partial<Poi> = {}): Poi {
  counter += 1;
  return {
    id: `poi-${counter}`,
    regionId: "osaka",
    name: `Poi ${counter}`,
    nameByLanguage: { ru: `Пои ${counter}`, en: `Poi ${counter}` },
    coordinates: { lat: 34.6937, lng: 135.5023 },
    description: "",
    descriptionByLanguage: { ru: "", en: "" },
    rating: 0,
    favoritesCount: 0,
    photos: [],
    category: "urban",
    tags: [],
    seasons: [],
    photoScore: 0,
    mustVisit: true,
    difficulty: "easy",
    durationMinutes: 60,
    importance: 1,
    status: "published",
    ...overrides
  };
}
