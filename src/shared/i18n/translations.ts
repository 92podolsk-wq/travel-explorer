import type { Difficulty, Poi, PoiCategory, PoiTag } from "@/entities/poi/model/types";
import type { ExplorationModeId } from "@/features/exploration-mode/model/types";
import type { Language } from "./types";

type ModeCopy = {
  label: string;
  description: string;
};

type PoiCopy = {
  description: string;
  bestTime: string[];
};

type TranslationDictionary = {
  app: {
    regionName: string;
    searchAria: string;
    searchPlaceholder: string;
    visible: string;
    saved: string;
    places: string;
    save: string;
    mustVisit: string;
    photo: string;
    best: string;
    duration: string;
    effort: string;
    bestTime: string;
    signals: string;
    minutesShort: string;
    language: string;
  };
  modes: Record<ExplorationModeId, ModeCopy>;
  poi: Record<string, PoiCopy>;
  category: Record<PoiCategory, string>;
  tag: Record<PoiTag, string>;
  difficulty: Record<Difficulty, string>;
};

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    app: {
      regionName: "Kyoto",
      searchAria: "Search places",
      searchPlaceholder: "Search Kyoto",
      visible: "visible",
      saved: "saved",
      places: "places",
      save: "Save",
      mustVisit: "Must Visit",
      photo: "Photo",
      best: "Best",
      duration: "Duration",
      effort: "Effort",
      bestTime: "Best Time",
      signals: "Signals",
      minutesShort: "m",
      language: "Language"
    },
    modes: {
      photographer: {
        label: "Photographer",
        description: "Photo score, light, viewpoints, and atmosphere."
      },
      "first-visit": {
        label: "First Visit",
        description: "Kyoto classics with strong planning value."
      },
      nature: {
        label: "Nature",
        description: "Gardens, rivers, mountains, and softer walking days."
      },
      autumn: {
        label: "Autumn",
        description: "Color, texture, and seasonal depth."
      },
      sakura: {
        label: "Sakura",
        description: "Spring blossom anchors and canal walks."
      },
      "hidden-gems": {
        label: "Hidden Gems",
        description: "Lower-density places with high discovery value."
      }
    },
    poi: {
      "fushimi-inari": {
        description:
          "A mountain shrine route lined with thousands of vermilion gates, strongest at sunrise and after dark.",
        bestTime: ["Sunrise", "Blue hour"]
      },
      "kiyomizu-dera": {
        description:
          "A hillside temple with broad city views, wooden architecture, and atmospheric approach streets.",
        bestTime: ["Opening", "Late afternoon"]
      },
      "arashiyama-bamboo": {
        description:
          "A compact bamboo corridor near river views, temples, and quieter northern walking routes.",
        bestTime: ["Early morning"]
      },
      gion: {
        description:
          "Kyoto's historic entertainment district with preserved streets, lanterns, tea houses, and evening atmosphere.",
        bestTime: ["Dusk", "Night"]
      },
      "philosophers-path": {
        description:
          "A canal-side walk connecting temples and small cafes, especially strong during cherry blossom season.",
        bestTime: ["Morning"]
      },
      "kinkaku-ji": {
        description:
          "The Golden Pavilion reflected in a pond, concise but iconic and visually clean in winter light.",
        bestTime: ["Opening", "Cloudy midday"]
      },
      "daigo-ji": {
        description:
          "A spacious temple complex with exceptional sakura, autumn color, and a quieter feeling than central Kyoto.",
        bestTime: ["Morning"]
      },
      "kurama-kibune": {
        description:
          "A forested temple-to-village walk north of Kyoto, ideal when the city center feels too dense.",
        bestTime: ["Morning", "After rain"]
      },
      "nishiki-market": {
        description:
          "A narrow food market that works well as a central reset between temple-heavy exploration blocks.",
        bestTime: ["Late morning"]
      },
      shugakuin: {
        description:
          "Elegant villa gardens with layered views across northeast Kyoto, best for slow visual exploration.",
        bestTime: ["Morning"]
      }
    },
    category: {
      temple: "temple",
      shrine: "shrine",
      garden: "garden",
      street: "street",
      district: "district",
      nature: "nature",
      viewpoint: "viewpoint",
      market: "market",
      museum: "museum"
    },
    tag: {
      "must-visit": "must visit",
      photographer: "photographer",
      "first-visit": "first visit",
      nature: "nature",
      autumn: "autumn",
      sakura: "sakura",
      "hidden-gem": "hidden gem",
      sunrise: "sunrise",
      night: "night",
      rain: "rain",
      "public-transport": "public transport",
      "light-trekking": "light trekking"
    },
    difficulty: {
      easy: "easy",
      moderate: "moderate",
      active: "active"
    }
  },
  ru: {
    app: {
      regionName: "Киото",
      searchAria: "Поиск мест",
      searchPlaceholder: "Поиск по Киото",
      visible: "видно",
      saved: "сохранено",
      places: "мест",
      save: "Сохранить",
      mustVisit: "Обязательно",
      photo: "Фото",
      best: "Лучше",
      duration: "Время",
      effort: "Сложность",
      bestTime: "Лучшее время",
      signals: "Признаки",
      minutesShort: "мин",
      language: "Язык"
    },
    modes: {
      photographer: {
        label: "Фотограф",
        description: "Фотогеничность, свет, видовые точки и атмосфера."
      },
      "first-visit": {
        label: "Первый визит",
        description: "Классика Киото с высокой ценностью для планирования."
      },
      nature: {
        label: "Природа",
        description: "Сады, реки, горы и спокойные прогулочные дни."
      },
      autumn: {
        label: "Осень",
        description: "Цвет, фактура и сезонная глубина."
      },
      sakura: {
        label: "Сакура",
        description: "Весенние точки цветения и прогулки вдоль каналов."
      },
      "hidden-gems": {
        label: "Скрытые места",
        description: "Менее людные места с высоким ощущением открытия."
      }
    },
    poi: {
      "fushimi-inari": {
        description:
          "Горный маршрут при святилище с тысячами алых тории, особенно сильный на рассвете и после заката.",
        bestTime: ["Рассвет", "Синий час"]
      },
      "kiyomizu-dera": {
        description:
          "Храм на склоне с широкими видами на город, деревянной архитектурой и атмосферными улицами на подходе.",
        bestTime: ["Открытие", "Поздний день"]
      },
      "arashiyama-bamboo": {
        description:
          "Компактная бамбуковая аллея рядом с рекой, храмами и более тихими северными прогулочными маршрутами.",
        bestTime: ["Раннее утро"]
      },
      gion: {
        description:
          "Исторический район Киото с сохранившимися улицами, фонарями, чайными домами и вечерней атмосферой.",
        bestTime: ["Сумерки", "Ночь"]
      },
      "philosophers-path": {
        description:
          "Прогулка вдоль канала, соединяющая храмы и маленькие кафе, особенно сильная в сезон цветения сакуры.",
        bestTime: ["Утро"]
      },
      "kinkaku-ji": {
        description:
          "Золотой павильон с отражением в пруду: короткое, но знаковое место, особенно чистое визуально в зимнем свете.",
        bestTime: ["Открытие", "Облачный полдень"]
      },
      "daigo-ji": {
        description:
          "Просторный храмовый комплекс с выдающейся сакурой, осенними красками и более спокойным ощущением, чем в центре.",
        bestTime: ["Утро"]
      },
      "kurama-kibune": {
        description:
          "Лесной маршрут от храма к деревне к северу от Киото, хороший выбор, когда центр кажется слишком плотным.",
        bestTime: ["Утро", "После дождя"]
      },
      "nishiki-market": {
        description:
          "Узкий гастрономический рынок, который хорошо работает как центральная пауза между храмовыми маршрутами.",
        bestTime: ["Позднее утро"]
      },
      shugakuin: {
        description:
          "Элегантные вилловые сады с многослойными видами на северо-восток Киото, лучше всего для медленного визуального исследования.",
        bestTime: ["Утро"]
      }
    },
    category: {
      temple: "храм",
      shrine: "святилище",
      garden: "сад",
      street: "улица",
      district: "район",
      nature: "природа",
      viewpoint: "видовая точка",
      market: "рынок",
      museum: "музей"
    },
    tag: {
      "must-visit": "обязательно",
      photographer: "фотографу",
      "first-visit": "первый визит",
      nature: "природа",
      autumn: "осень",
      sakura: "сакура",
      "hidden-gem": "скрытое место",
      sunrise: "рассвет",
      night: "ночь",
      rain: "дождь",
      "public-transport": "общественный транспорт",
      "light-trekking": "легкий треккинг"
    },
    difficulty: {
      easy: "легко",
      moderate: "средне",
      active: "активно"
    }
  }
};

export function getTranslations(language: Language) {
  return translations[language];
}

export function getLocalizedPoiSearchText(poi: Poi, language: Language) {
  const dictionary = getTranslations(language);
  const poiCopy = dictionary.poi[poi.id];
  const categories = poi.categories.map((category) => dictionary.category[category]);
  const tags = poi.tags.map((tag) => dictionary.tag[tag]);
  const bestTime = poiCopy?.bestTime ?? poi.bestTime;

  return [
    poi.name,
    poi.description,
    poiCopy?.description,
    dictionary.difficulty[poi.difficulty],
    ...categories,
    ...tags,
    ...bestTime
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
