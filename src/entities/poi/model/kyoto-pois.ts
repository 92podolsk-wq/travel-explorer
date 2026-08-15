import type { Poi } from "./types";

const kyotoPoisWithoutStatus: Omit<Poi, "status" | "descriptionByLanguage" | "favoritesCount">[] = [
  {
    id: "fushimi-inari",
    name: "Fushimi Inari Taisha",
    nameByLanguage: { en: "Fushimi Inari Taisha", ru: "Фусими Инари Тайся" },
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
    category: "temples",
    tags: ["must-visit", "photographer", "autumn", "sunrise", "night", "first-visit"],
    seasons: ["spring", "autumn", "winter"],
    photoScore: 98,
    difficulty: "active",
    durationMinutes: 150,
    importance: 100,
    regionId: "kyoto"
  },
  {
    id: "kiyomizu-dera",
    name: "Kiyomizu-dera",
    nameByLanguage: { en: "Kiyomizu-dera", ru: "Киёмидзу-дэра" },
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
    category: "temples",
    tags: ["must-visit", "photographer", "first-visit", "sakura", "autumn"],
    seasons: ["spring", "autumn"],
    photoScore: 94,
    difficulty: "moderate",
    durationMinutes: 120,
    importance: 98,
    regionId: "kyoto"
  },
  {
    id: "arashiyama-bamboo",
    name: "Arashiyama Bamboo Grove",
    nameByLanguage: { en: "Arashiyama Bamboo Grove", ru: "Бамбуковая роща Арасияма" },
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
    category: "nature",
    tags: ["must-visit", "photographer", "first-visit", "nature", "rain"],
    seasons: ["all year"],
    photoScore: 91,
    difficulty: "easy",
    durationMinutes: 90,
    importance: 95,
    regionId: "kyoto"
  },
  {
    id: "gion",
    name: "Gion",
    nameByLanguage: { en: "Gion", ru: "Гион" },
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
    category: "urban",
    tags: ["must-visit", "photographer", "first-visit", "night", "rain"],
    seasons: ["all year"],
    photoScore: 92,
    difficulty: "easy",
    durationMinutes: 120,
    importance: 94,
    regionId: "kyoto"
  },
  {
    id: "philosophers-path",
    name: "Philosopher's Path",
    nameByLanguage: { en: "Philosopher's Path", ru: "Тропа философа" },
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
    category: "urban",
    tags: ["photographer", "sakura", "nature", "first-visit", "public-transport"],
    seasons: ["spring"],
    photoScore: 89,
    difficulty: "easy",
    durationMinutes: 75,
    importance: 86,
    regionId: "kyoto"
  },
  {
    id: "kinkaku-ji",
    name: "Kinkaku-ji",
    nameByLanguage: { en: "Kinkaku-ji", ru: "Кинкаку-дзи" },
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
    category: "temples",
    tags: ["must-visit", "first-visit", "photographer", "autumn"],
    seasons: ["autumn", "winter"],
    photoScore: 88,
    difficulty: "easy",
    durationMinutes: 60,
    importance: 92,
    regionId: "kyoto"
  },
  {
    id: "daigo-ji",
    name: "Daigo-ji",
    nameByLanguage: { en: "Daigo-ji", ru: "Дайго-дзи" },
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
    category: "temples",
    tags: ["sakura", "autumn", "hidden-gem", "photographer", "public-transport"],
    seasons: ["spring", "autumn"],
    photoScore: 86,
    difficulty: "moderate",
    durationMinutes: 150,
    importance: 80,
    regionId: "kyoto"
  },
  {
    id: "kurama-kibune",
    name: "Kurama to Kibune",
    nameByLanguage: { en: "Kurama to Kibune", ru: "Курама — Кибунэ" },
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
    category: "nature",
    tags: ["nature", "hidden-gem", "light-trekking", "autumn", "photographer"],
    seasons: ["summer", "autumn"],
    photoScore: 87,
    difficulty: "active",
    durationMinutes: 210,
    importance: 78,
    regionId: "kyoto"
  },
  {
    id: "nishiki-market",
    name: "Nishiki Market",
    nameByLanguage: { en: "Nishiki Market", ru: "Рынок Нисики" },
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
    category: "urban",
    tags: ["first-visit", "rain", "public-transport"],
    seasons: ["all year"],
    photoScore: 72,
    difficulty: "easy",
    durationMinutes: 60,
    importance: 74,
    regionId: "kyoto"
  },
  {
    id: "shugakuin",
    name: "Shugakuin Imperial Villa",
    nameByLanguage: { en: "Shugakuin Imperial Villa", ru: "Императорская вилла Сюгакуин" },
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
    category: "gardens",
    tags: ["hidden-gem", "autumn", "photographer", "nature"],
    seasons: ["autumn", "spring"],
    photoScore: 84,
    difficulty: "moderate",
    durationMinutes: 120,
    importance: 70,
    regionId: "kyoto"
  },
  {
    id: "osaka-castle",
    regionId: "osaka",
    name: "Osaka Castle",
    nameByLanguage: { en: "Osaka Castle", ru: "Замок Осака" },
    coordinates: {
      lat: 34.6873,
      lng: 135.5262
    },
    description: "A rebuilt castle tower rising over stone ramparts and a moat, with expansive park grounds especially vivid during cherry blossom season.",
    rating: 4.6,
    photos: [
      {
        id: "osaka-castle-main",
        url: "/photos/osaka/osaka-castle/1.jpg",
        alt: "Osaka Castle tower over stone ramparts"
      }
    ],
    category: "museums",
    tags: ["must-visit", "first-visit", "sakura", "photographer"],
    seasons: ["spring", "autumn"],
    photoScore: 90,
    difficulty: "easy",
    durationMinutes: 120,
    importance: 96
  },
  {
    id: "dotonbori",
    regionId: "osaka",
    name: "Dotonbori",
    nameByLanguage: { en: "Dotonbori", ru: "Дотонбори" },
    coordinates: {
      lat: 34.6687,
      lng: 135.5013
    },
    description: "A neon-lit canal district packed with oversized signage, street food stalls, and constant evening energy.",
    rating: 4.5,
    photos: [
      {
        id: "dotonbori-main",
        url: "/photos/osaka/dotonbori/1.jpg",
        alt: "Dotonbori canal at night with neon signs",
        author: "Martin Falbisoner"
      }
    ],
    category: "urban",
    tags: ["must-visit", "photographer", "night", "first-visit"],
    seasons: ["all year"],
    photoScore: 93,
    difficulty: "easy",
    durationMinutes: 90,
    importance: 95
  },
  {
    id: "shinsekai",
    regionId: "osaka",
    name: "Shinsekai",
    nameByLanguage: { en: "Shinsekai", ru: "Синсэкай" },
    coordinates: {
      lat: 34.6523,
      lng: 135.5062
    },
    description: "A retro entertainment quarter beneath Tsutenkaku Tower, known for lantern-lined alleys and old-school kushikatsu shops.",
    rating: 4.3,
    photos: [
      {
        id: "shinsekai-main",
        url: "/photos/osaka/shinsekai/1.jpg",
        alt: "Retro street in Shinsekai beneath Tsutenkaku Tower"
      }
    ],
    category: "urban",
    tags: ["photographer", "night", "hidden-gem"],
    seasons: ["all year"],
    photoScore: 85,
    difficulty: "easy",
    durationMinutes: 75,
    importance: 78
  },
  {
    id: "osaka-aquarium",
    regionId: "osaka",
    name: "Osaka Aquarium Kaiyukan",
    nameByLanguage: { en: "Osaka Aquarium Kaiyukan", ru: "Аквариум Кайюкан" },
    coordinates: {
      lat: 34.6547,
      lng: 135.429
    },
    description: "A vast tank-based aquarium built around a central Pacific Ocean tank, home to whale sharks and manta rays.",
    rating: 4.6,
    photos: [
      {
        id: "osaka-aquarium-main",
        url: "/photos/osaka/osaka-aquarium/1.jpg",
        alt: "Interior of Osaka Aquarium Kaiyukan",
        author: "Sakai Yayoi"
      }
    ],
    category: "museums",
    tags: ["first-visit", "must-visit", "public-transport"],
    seasons: ["all year"],
    photoScore: 82,
    difficulty: "easy",
    durationMinutes: 150,
    importance: 88
  },
  {
    id: "shitennoji",
    regionId: "osaka",
    name: "Shitennoji Temple",
    nameByLanguage: { en: "Shitennoji Temple", ru: "Храм Ситэнно-дзи" },
    coordinates: {
      lat: 34.6534,
      lng: 135.5163
    },
    description: "One of Japan's oldest Buddhist temples, with a symmetrical five-story pagoda and a quiet turtle pond garden.",
    rating: 4.4,
    photos: [
      {
        id: "shitennoji-main",
        url: "/photos/osaka/shitennoji/1.jpg",
        alt: "Shitennoji temple pagoda in Osaka",
        author: "名古屋太郎"
      }
    ],
    category: "temples",
    tags: ["hidden-gem", "first-visit", "photographer"],
    seasons: ["spring", "autumn"],
    photoScore: 84,
    difficulty: "easy",
    durationMinutes: 90,
    importance: 76
  },
  {
    id: "umeda-sky-building",
    regionId: "osaka",
    name: "Umeda Sky Building",
    nameByLanguage: { en: "Umeda Sky Building", ru: "Небоскрёб Умэда Скай Билдинг" },
    coordinates: {
      lat: 34.7054,
      lng: 135.4903
    },
    description: "A twin-tower skyscraper joined by a floating open-air observatory with wide sunset views over the city.",
    rating: 4.5,
    photos: [
      {
        id: "umeda-sky-building-main",
        url: "/photos/osaka/umeda-sky-building/1.jpg",
        alt: "Umeda Sky Building twin towers"
      }
    ],
    category: "viewpoints",
    tags: ["photographer", "sunrise", "night", "must-visit"],
    seasons: ["all year"],
    photoScore: 91,
    difficulty: "easy",
    durationMinutes: 60,
    importance: 87
  },
  {
    id: "kuromon-market",
    regionId: "osaka",
    name: "Kuromon Ichiba Market",
    nameByLanguage: { en: "Kuromon Ichiba Market", ru: "Рынок Куромон Итиба" },
    coordinates: {
      lat: 34.6656,
      lng: 135.5062
    },
    description: "A narrow covered market famous for fresh seafood, street-grilled skewers, and a steady stream of walking snacks.",
    rating: 4.4,
    photos: [
      {
        id: "kuromon-market-main",
        url: "/photos/osaka/kuromon-market/1.jpg",
        alt: "Kuromon Ichiba Market food stalls"
      }
    ],
    category: "urban",
    tags: ["first-visit", "rain", "public-transport"],
    seasons: ["all year"],
    photoScore: 74,
    difficulty: "easy",
    durationMinutes: 60,
    importance: 72
  },
  {
    id: "sumiyoshi-taisha",
    regionId: "osaka",
    name: "Sumiyoshi Taisha",
    nameByLanguage: { en: "Sumiyoshi Taisha", ru: "Сумиёси Тайся" },
    coordinates: {
      lat: 34.6125,
      lng: 135.4933
    },
    description: "A grand Shinto shrine complex with a distinctive arched drum bridge and unusually styled straight-line main halls.",
    rating: 4.5,
    photos: [
      {
        id: "sumiyoshi-taisha-main",
        url: "/photos/osaka/sumiyoshi-taisha/1.jpg",
        alt: "Sumiyoshi Taisha shrine grounds",
        author: "Saigen Jiro"
      }
    ],
    category: "temples",
    tags: ["hidden-gem", "photographer", "public-transport"],
    seasons: ["all year"],
    photoScore: 86,
    difficulty: "easy",
    durationMinutes: 75,
    importance: 74
  },
  {
    id: "namba-yasaka",
    regionId: "osaka",
    name: "Namba Yasaka Shrine",
    nameByLanguage: { en: "Namba Yasaka Shrine", ru: "Святилище Намба Ясака" },
    coordinates: {
      lat: 34.6626,
      lng: 135.5
    },
    description: "A compact shrine built around a giant lion-head stage said to devour misfortune, a striking and unusual photo subject.",
    rating: 4.3,
    photos: [
      {
        id: "namba-yasaka-main",
        url: "/photos/osaka/namba-yasaka/1.jpg",
        alt: "Namba Yasaka Shrine lion-head stage"
      }
    ],
    category: "temples",
    tags: ["photographer", "hidden-gem"],
    seasons: ["all year"],
    photoScore: 88,
    difficulty: "easy",
    durationMinutes: 30,
    importance: 70
  }
];

export const kyotoPois: Poi[] = kyotoPoisWithoutStatus.map((poi) => ({
  ...poi,
  descriptionByLanguage: { en: poi.description, ru: poi.description },
  status: "published" as const,
  favoritesCount: 0
}));
