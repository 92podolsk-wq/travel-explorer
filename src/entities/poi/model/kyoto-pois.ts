import type { Poi } from "./types";

export const kyotoPois: Poi[] = [
  {
    id: "fushimi-inari",
    name: "Fushimi Inari Taisha",
    coordinates: { lat: 34.9671, lng: 135.7727 },
    description:
      "A mountain shrine route lined with thousands of vermilion gates, strongest at sunrise and after dark.",
    rating: 4.9,
    photos: [
      {
        id: "fushimi-main",
        url: "/photos/fushimi-inari/1.jpg",
        alt: "Vermilion torii gates at Fushimi Inari",
        author: "Paul Vlaar"
      },
      {
        id: "fushimi-senbon-torii",
        url: "/photos/fushimi-inari/2.jpg",
        alt: "Senbon Torii pathway at Fushimi Inari Taisha",
        author: "Yanajin33"
      }
    ],
    categories: ["shrine", "nature"],
    tags: ["must-visit", "photographer", "autumn", "sunrise", "night", "first-visit"],
    seasons: ["spring", "autumn", "winter"],
    photoScore: 98,
    mustVisit: true,
    bestTime: ["Sunrise", "Blue hour"],
    difficulty: "active",
    durationMinutes: 150,
    importance: 100,
    visibilityMode: "default"
  },
  {
    id: "kiyomizu-dera",
    name: "Kiyomizu-dera",
    coordinates: { lat: 34.9949, lng: 135.785 },
    description:
      "A hillside temple with broad city views, wooden architecture, and atmospheric approach streets.",
    rating: 4.8,
    photos: [
      {
        id: "kiyomizu-main",
        url: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1400&q=82",
        alt: "Kiyomizu-dera temple in Kyoto"
      }
    ],
    categories: ["temple", "viewpoint", "street"],
    tags: ["must-visit", "photographer", "first-visit", "sakura", "autumn"],
    seasons: ["spring", "autumn"],
    photoScore: 94,
    mustVisit: true,
    bestTime: ["Opening", "Late afternoon"],
    difficulty: "moderate",
    durationMinutes: 120,
    importance: 98,
    visibilityMode: "default"
  },
  {
    id: "arashiyama-bamboo",
    name: "Arashiyama Bamboo Grove",
    coordinates: { lat: 35.017,
      lng: 135.6719 },
    description:
      "A compact bamboo corridor near river views, temples, and quieter northern walking routes.",
    rating: 4.6,
    photos: [
      {
        id: "arashiyama-main",
        url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=82",
        alt: "Bamboo grove in Arashiyama"
      }
    ],
    categories: ["nature", "street"],
    tags: ["must-visit", "photographer", "first-visit", "nature", "rain"],
    seasons: ["all year"],
    photoScore: 91,
    mustVisit: true,
    bestTime: ["Early morning"],
    difficulty: "easy",
    durationMinutes: 90,
    importance: 95,
    visibilityMode: "default"
  },
  {
    id: "gion",
    name: "Gion",
    coordinates: { lat: 35.0037, lng: 135.7751 },
    description:
      "Kyoto's historic entertainment district with preserved streets, lanterns, tea houses, and evening atmosphere.",
    rating: 4.7,
    photos: [
      {
        id: "gion-main",
        url: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=1400&q=82",
        alt: "Traditional street in Gion at dusk"
      }
    ],
    categories: ["district", "street"],
    tags: ["must-visit", "photographer", "first-visit", "night", "rain"],
    seasons: ["all year"],
    photoScore: 92,
    mustVisit: true,
    bestTime: ["Dusk", "Night"],
    difficulty: "easy",
    durationMinutes: 120,
    importance: 94,
    visibilityMode: "default"
  },
  {
    id: "philosophers-path",
    name: "Philosopher's Path",
    coordinates: { lat: 35.0268, lng: 135.7975 },
    description:
      "A canal-side walk connecting temples and small cafes, especially strong during cherry blossom season.",
    rating: 4.6,
    photos: [
      {
        id: "philosophers-main",
        url: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1400&q=82",
        alt: "Cherry blossoms over a Kyoto canal"
      }
    ],
    categories: ["street", "nature"],
    tags: ["photographer", "sakura", "nature", "first-visit", "public-transport"],
    seasons: ["spring"],
    photoScore: 89,
    mustVisit: false,
    bestTime: ["Morning"],
    difficulty: "easy",
    durationMinutes: 75,
    importance: 86,
    visibilityMode: "default"
  },
  {
    id: "kinkaku-ji",
    name: "Kinkaku-ji",
    coordinates: { lat: 35.0394, lng: 135.7292 },
    description:
      "The Golden Pavilion reflected in a pond, concise but iconic and visually clean in winter light.",
    rating: 4.7,
    photos: [
      {
        id: "kinkaku-main",
        url: "https://images.unsplash.com/photo-1558862107-d49ef2a04d72?auto=format&fit=crop&w=1400&q=82",
        alt: "Kinkaku-ji Golden Pavilion"
      }
    ],
    categories: ["temple", "garden"],
    tags: ["must-visit", "first-visit", "photographer", "autumn"],
    seasons: ["autumn", "winter"],
    photoScore: 88,
    mustVisit: true,
    bestTime: ["Opening", "Cloudy midday"],
    difficulty: "easy",
    durationMinutes: 60,
    importance: 92,
    visibilityMode: "default"
  },
  {
    id: "daigo-ji",
    name: "Daigo-ji",
    coordinates: { lat: 34.951, lng: 135.8195 },
    description:
      "A spacious temple complex with exceptional sakura, autumn color, and a quieter feeling than central Kyoto.",
    rating: 4.6,
    photos: [
      {
        id: "daigo-main",
        url: "https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&w=1400&q=82",
        alt: "Kyoto temple garden in spring"
      }
    ],
    categories: ["temple", "garden"],
    tags: ["sakura", "autumn", "hidden-gem", "photographer", "public-transport"],
    seasons: ["spring", "autumn"],
    photoScore: 86,
    mustVisit: false,
    bestTime: ["Morning"],
    difficulty: "moderate",
    durationMinutes: 150,
    importance: 80,
    visibilityMode: "default"
  },
  {
    id: "kurama-kibune",
    name: "Kurama to Kibune",
    coordinates: { lat: 35.1217, lng: 135.7707 },
    description:
      "A forested temple-to-village walk north of Kyoto, ideal when the city center feels too dense.",
    rating: 4.7,
    photos: [
      {
        id: "kurama-main",
        url: "https://images.unsplash.com/photo-1505069446780-4ef442b5207f?auto=format&fit=crop&w=1400&q=82",
        alt: "Mossy forest path near Kyoto"
      }
    ],
    categories: ["nature", "temple"],
    tags: ["nature", "hidden-gem", "light-trekking", "autumn", "photographer"],
    seasons: ["summer", "autumn"],
    photoScore: 87,
    mustVisit: false,
    bestTime: ["Morning", "After rain"],
    difficulty: "active",
    durationMinutes: 210,
    importance: 78,
    visibilityMode: "default"
  },
  {
    id: "nishiki-market",
    name: "Nishiki Market",
    coordinates: { lat: 35.005, lng: 135.7647 },
    description:
      "A narrow food market that works well as a central reset between temple-heavy exploration blocks.",
    rating: 4.4,
    photos: [
      {
        id: "nishiki-main",
        url: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1400&q=82",
        alt: "Japanese market food stall"
      }
    ],
    categories: ["market", "street"],
    tags: ["first-visit", "rain", "public-transport"],
    seasons: ["all year"],
    photoScore: 72,
    mustVisit: false,
    bestTime: ["Late morning"],
    difficulty: "easy",
    durationMinutes: 60,
    importance: 74,
    visibilityMode: "default"
  },
  {
    id: "shugakuin",
    name: "Shugakuin Imperial Villa",
    coordinates: { lat: 35.0514, lng: 135.7973 },
    description:
      "Elegant villa gardens with layered views across northeast Kyoto, best for slow visual exploration.",
    rating: 4.6,
    photos: [
      {
        id: "shugakuin-main",
        url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=82",
        alt: "Japanese garden and pond"
      }
    ],
    categories: ["garden", "viewpoint"],
    tags: ["hidden-gem", "autumn", "photographer", "nature"],
    seasons: ["autumn", "spring"],
    photoScore: 84,
    mustVisit: false,
    bestTime: ["Morning"],
    difficulty: "moderate",
    durationMinutes: 120,
    importance: 70,
    visibilityMode: "default"
  }
];
