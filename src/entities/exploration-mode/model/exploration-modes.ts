import type { ExplorationMode } from "./types";

export const seedExplorationModes: ExplorationMode[] = [
  {
    id: "photographer",
    position: 0,
    name: "Photographer",
    nameByLanguage: { en: "Photographer", ru: "Фотограф", ja: "写真家" },
    description: "Photo score, light, viewpoints, and atmosphere.",
    descriptionByLanguage: {
      en: "Photo score, light, viewpoints, and atmosphere.",
      ru: "Фотогеничность, свет, видовые точки и атмосфера.",
      ja: "写真映え、光、眺望、雰囲気で選定。"
    },
    tags: ["photographer", "sunrise", "night", "rain"],
    icon: "camera"
  },
  {
    id: "first-visit",
    position: 1,
    name: "First Visit",
    nameByLanguage: { en: "First Visit", ru: "Первое посещение", ja: "初めての訪問" },
    description: "Kyoto classics with strong planning value.",
    descriptionByLanguage: {
      en: "Kyoto classics with strong planning value.",
      ru: "Классические места, обязательные к посещению.",
      ja: "訪れておきたい定番スポット。"
    },
    tags: ["first-visit", "must-visit", "public-transport"],
    icon: "compass"
  },
  {
    id: "nature",
    position: 2,
    name: "Nature",
    nameByLanguage: { en: "Nature", ru: "Природа", ja: "自然" },
    description: "Gardens, rivers, mountains, and softer walking days.",
    descriptionByLanguage: {
      en: "Gardens, rivers, mountains, and softer walking days.",
      ru: "Сады, реки, горы и спокойные прогулки.",
      ja: "庭園、川、山などゆったり歩ける場所。"
    },
    tags: ["nature", "light-trekking", "rain"],
    icon: "leaf"
  },
  {
    id: "autumn",
    position: 3,
    name: "Autumn",
    nameByLanguage: { en: "Autumn", ru: "Осень", ja: "秋" },
    description: "Color, texture, and seasonal depth.",
    descriptionByLanguage: {
      en: "Color, texture, and seasonal depth.",
      ru: "Осенние краски и сезонная атмосфера.",
      ja: "紅葉と秋ならではの風情。"
    },
    tags: ["autumn", "photographer"],
    icon: "tree"
  },
  {
    id: "sakura",
    position: 4,
    name: "Sakura",
    nameByLanguage: { en: "Sakura", ru: "Сакура", ja: "桜" },
    description: "Spring blossom anchors and canal walks.",
    descriptionByLanguage: {
      en: "Spring blossom anchors and canal walks.",
      ru: "Цветение сакуры и прогулки вдоль каналов.",
      ja: "桜の名所と運河沿いの散策。"
    },
    tags: ["sakura", "photographer"],
    icon: "flower"
  }
];

export const defaultExplorationMode = seedExplorationModes[0];
