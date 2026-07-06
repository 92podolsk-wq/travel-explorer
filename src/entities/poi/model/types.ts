export type PoiCategory =
  | "temple"
  | "shrine"
  | "garden"
  | "street"
  | "district"
  | "nature"
  | "viewpoint"
  | "market"
  | "museum";

export type PoiTag =
  | "must-visit"
  | "photographer"
  | "first-visit"
  | "nature"
  | "autumn"
  | "sakura"
  | "hidden-gem"
  | "sunrise"
  | "night"
  | "rain"
  | "public-transport"
  | "light-trekking";

export type Difficulty = "easy" | "moderate" | "active";

export type PoiVisibilityMode = "default" | "zoomed-in";

export type Season = "spring" | "summer" | "autumn" | "winter";

export type Photo = {
  id: string;
  url: string;
  alt: string;
  author?: string;
  season?: Season;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Poi = {
  id: string;
  regionId: string;
  name: string;
  coordinates: Coordinates;
  description: string;
  rating: number;
  photos: Photo[];
  categories: PoiCategory[];
  tags: PoiTag[];
  seasons: string[];
  photoScore: number;
  mustVisit: boolean;
  bestTime: string[];
  difficulty: Difficulty;
  durationMinutes: number;
  importance: number;
  visibilityMode: PoiVisibilityMode;
};

export type PoiInput = Omit<Poi, "id"> & { id?: string };
