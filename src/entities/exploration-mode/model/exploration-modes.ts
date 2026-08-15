import type { ExplorationMode } from "./types";

export const seedExplorationModes: ExplorationMode[] = [
  {
    id: "photographer",
    position: 0,
    name: "Photographer",
    nameByLanguage: { en: "Photographer", ru: "Фотограф" },
    description: "Photo score, light, viewpoints, and atmosphere.",
    descriptionByLanguage: {
      en: "Photo score, light, viewpoints, and atmosphere.",
      ru: "Фотогеничность, свет, видовые точки и атмосфера."
    },
    tags: ["photographer", "sunrise", "night", "rain"],
    icon: "camera"
  },
  {
    id: "first-visit",
    position: 1,
    name: "First Visit",
    nameByLanguage: { en: "First Visit", ru: "Первое посещение" },
    description: "Kyoto classics with strong planning value.",
    descriptionByLanguage: {
      en: "Kyoto classics with strong planning value.",
      ru: "Классические места, обязательные к посещению."
    },
    tags: ["first-visit", "must-visit", "public-transport"],
    icon: "compass"
  },
  {
    id: "nature",
    position: 2,
    name: "Nature",
    nameByLanguage: { en: "Nature", ru: "Природа" },
    description: "Gardens, rivers, mountains, and softer walking days.",
    descriptionByLanguage: {
      en: "Gardens, rivers, mountains, and softer walking days.",
      ru: "Сады, реки, горы и спокойные прогулки."
    },
    tags: ["nature", "light-trekking", "rain"],
    icon: "leaf"
  },
  {
    id: "autumn",
    position: 3,
    name: "Autumn",
    nameByLanguage: { en: "Autumn", ru: "Осень" },
    description: "Color, texture, and seasonal depth.",
    descriptionByLanguage: {
      en: "Color, texture, and seasonal depth.",
      ru: "Осенние краски и сезонная атмосфера."
    },
    tags: ["autumn", "photographer"],
    icon: "tree"
  },
  {
    id: "sakura",
    position: 4,
    name: "Sakura",
    nameByLanguage: { en: "Sakura", ru: "Сакура" },
    description: "Spring blossom anchors and canal walks.",
    descriptionByLanguage: {
      en: "Spring blossom anchors and canal walks.",
      ru: "Цветение сакуры и прогулки вдоль каналов."
    },
    tags: ["sakura", "photographer"],
    icon: "flower"
  }
];

export const defaultExplorationMode = seedExplorationModes[0];
