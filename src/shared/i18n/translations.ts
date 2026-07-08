import type { Difficulty, Poi, PoiCategory, PoiTag, Season } from "@/entities/poi/model/types";
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
    region: string;
    country: string;
    area: string;
    city: string;
    hideDetails: string;
    showDetails: string;
    sunrise: string;
    sunset: string;
    exportKml: string;
    exportKmlHint: string;
    openInMaps: string;
    openInMapsHint: string;
    hideViewedHint: string;
    showViewedHint: string;
    visited: string;
    hideFavoritesHint: string;
    showFavoritesHint: string;
    hideVisitedHint: string;
    showVisitedHint: string;
    kyotoGreeting: string;
    seasonFilter: string;
    noSeasonPhotoHint: string;
    tomorrow: string;
    now: string;
  };
  modes: Record<ExplorationModeId, ModeCopy>;
  poi: Record<string, PoiCopy>;
  category: Record<PoiCategory, string>;
  tag: Record<PoiTag, string>;
  difficulty: Record<Difficulty, string>;
  season: Record<Season, string>;
  auth: {
    login: string;
    register: string;
    logout: string;
    account: string;
    email: string;
    password: string;
    name: string;
    loginTitle: string;
    registerTitle: string;
    submit: string;
    switchToRegister: string;
    switchToLogin: string;
    savedPlaces: string;
    viewedPlaces: string;
    visitedPlaces: string;
    noSavedPlaces: string;
    noViewedPlaces: string;
    noVisitedPlaces: string;
    memberSince: string;
    chooseAvatar: string;
    changeAvatar: string;
  };
};

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    app: {
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
      language: "Language",
      region: "Region",
      country: "Country",
      area: "Area",
      city: "City",
      hideDetails: "Hide details",
      showDetails: "Show details",
      sunrise: "Sunrise",
      sunset: "Sunset",
      exportKml: "KML",
      exportKmlHint: "Download saved places to open in Google My Maps",
      openInMaps: "Maps",
      openInMapsHint: "Open saved places as an optimized route in Google Maps",
      hideViewedHint: "Hide viewed places from the map",
      showViewedHint: "Show viewed places on the map",
      visited: "Visited",
      hideFavoritesHint: "Hide saved places from the map",
      showFavoritesHint: "Show saved places on the map",
      hideVisitedHint: "Hide visited places from the map",
      showVisitedHint: "Show visited places on the map",
      kyotoGreeting: "Konnichiwa!",
      seasonFilter: "Season",
      noSeasonPhotoHint: "No photo for this season — showing the default one",
      tomorrow: "Tomorrow",
      now: "Now"
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
    },
    season: {
      spring: "Spring",
      summer: "Summer",
      autumn: "Autumn",
      winter: "Winter"
    },
    auth: {
      login: "Log in",
      register: "Register",
      logout: "Log out",
      account: "My account",
      email: "Email",
      password: "Password",
      name: "Name",
      loginTitle: "Sign in",
      registerTitle: "Create an account",
      submit: "Continue",
      switchToRegister: "No account yet? Register",
      switchToLogin: "Already have an account? Log in",
      savedPlaces: "Saved places",
      viewedPlaces: "Viewed places",
      visitedPlaces: "Visited places",
      noSavedPlaces: "No saved places yet",
      noViewedPlaces: "No viewed places yet",
      noVisitedPlaces: "No visited places yet",
      memberSince: "Member since",
      chooseAvatar: "Choose an avatar",
      changeAvatar: "Change avatar"
    }
  },
  ru: {
    app: {
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
      language: "Язык",
      region: "Регион",
      country: "Страна",
      area: "Регион",
      city: "Город",
      hideDetails: "Скрыть панель",
      showDetails: "Показать панель",
      sunrise: "Восход",
      sunset: "Закат",
      exportKml: "KML",
      exportKmlHint: "Скачать сохранённые места для открытия в Google Мои карты",
      openInMaps: "Maps",
      openInMapsHint: "Открыть сохранённые места оптимизированным маршрутом в Google Maps",
      hideViewedHint: "Скрыть просмотренные места с карты",
      showViewedHint: "Показать просмотренные места на карте",
      visited: "Посещено",
      hideFavoritesHint: "Скрыть сохранённые места с карты",
      showFavoritesHint: "Показать сохранённые места на карте",
      hideVisitedHint: "Скрыть посещённые места с карты",
      showVisitedHint: "Показать посещённые места на карте",
      kyotoGreeting: "Коничива!",
      seasonFilter: "Сезон",
      noSeasonPhotoHint: "Нет фото для этого сезона — показано стандартное",
      tomorrow: "Завтра",
      now: "Сейчас"
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
    },
    season: {
      spring: "Весна",
      summer: "Лето",
      autumn: "Осень",
      winter: "Зима"
    },
    auth: {
      login: "Войти",
      register: "Регистрация",
      logout: "Выйти",
      account: "Личный кабинет",
      email: "Email",
      password: "Пароль",
      name: "Имя",
      loginTitle: "Вход",
      registerTitle: "Создать аккаунт",
      submit: "Продолжить",
      switchToRegister: "Нет аккаунта? Зарегистрироваться",
      switchToLogin: "Уже есть аккаунт? Войти",
      savedPlaces: "Сохранённые места",
      viewedPlaces: "Просмотренные места",
      visitedPlaces: "Посещённые места",
      noSavedPlaces: "Пока нет сохранённых мест",
      noViewedPlaces: "Пока нет просмотренных мест",
      noVisitedPlaces: "Пока нет посещённых мест",
      memberSince: "Дата регистрации",
      chooseAvatar: "Выберите аватар",
      changeAvatar: "Сменить аватар"
    }
  },
  ja: {
    app: {
      searchAria: "場所を検索",
      searchPlaceholder: "京都を検索",
      visible: "件表示中",
      saved: "件保存済み",
      places: "件",
      save: "保存",
      mustVisit: "必見",
      photo: "写真",
      best: "おすすめ",
      duration: "所要時間",
      effort: "難易度",
      bestTime: "おすすめの時間",
      signals: "特徴",
      minutesShort: "分",
      language: "言語",
      region: "地域",
      country: "国",
      area: "地方",
      city: "都市",
      hideDetails: "パネルを閉じる",
      showDetails: "パネルを開く",
      sunrise: "日の出",
      sunset: "日の入り",
      exportKml: "KML",
      exportKmlHint: "Googleマイマップで開くために保存した場所をダウンロード",
      openInMaps: "マップ",
      openInMapsHint: "保存した場所を最適化されたルートとしてGoogleマップで開く",
      hideViewedHint: "閲覧済みの場所を地図から隠す",
      showViewedHint: "閲覧済みの場所を地図に表示",
      visited: "訪問済み",
      hideFavoritesHint: "保存した場所を地図から隠す",
      showFavoritesHint: "保存した場所を地図に表示",
      hideVisitedHint: "訪問済みの場所を地図から隠す",
      showVisitedHint: "訪問済みの場所を地図に表示",
      kyotoGreeting: "こんにちは！",
      seasonFilter: "季節",
      noSeasonPhotoHint: "この季節の写真がありません — デフォルトを表示",
      tomorrow: "明日",
      now: "現在"
    },
    modes: {
      photographer: {
        label: "フォトグラファー",
        description: "写真スコア、光、眺望、雰囲気。"
      },
      "first-visit": {
        label: "初めての訪問",
        description: "計画価値の高い京都の定番スポット。"
      },
      nature: {
        label: "自然",
        description: "庭園、川、山、穏やかな散策日和。"
      },
      autumn: {
        label: "秋",
        description: "色彩、質感、季節の深み。"
      },
      sakura: {
        label: "桜",
        description: "春の桜の名所と運河沿いの散策。"
      }
    },
    poi: {
      "fushimi-inari": {
        description:
          "何千もの朱色の鳥居が連なる山の神社ルート。日の出と夜が特に美しい。",
        bestTime: ["日の出", "ブルーアワー"]
      },
      "kiyomizu-dera": {
        description:
          "市内を一望できる高台の寺院。木造建築と趣のある参道が魅力。",
        bestTime: ["開門直後", "夕方遅く"]
      },
      "arashiyama-bamboo": {
        description:
          "川沿いの眺めや寺院、静かな北部の散策路に近いコンパクトな竹林の小道。",
        bestTime: ["早朝"]
      },
      gion: {
        description:
          "保存された町並み、提灯、茶屋、夜の雰囲気が漂う京都の歴史ある花街。",
        bestTime: ["夕暮れ", "夜"]
      },
      "philosophers-path": {
        description:
          "寺院と小さなカフェをつなぐ運河沿いの散策路。桜の季節に特に美しい。",
        bestTime: ["朝"]
      },
      "kinkaku-ji": {
        description:
          "池に映る金閣。簡潔ながら象徴的で、冬の光の中では特に美しく見える。",
        bestTime: ["開門直後", "曇りの昼"]
      },
      "daigo-ji": {
        description:
          "見事な桜と紅葉を誇る広大な寺院群。中心部より落ち着いた雰囲気。",
        bestTime: ["朝"]
      },
      "kurama-kibune": {
        description:
          "京都中心部が混み合いすぎていると感じたときに最適な、鞍馬から貴船へ抜ける森の道。",
        bestTime: ["朝", "雨上がり"]
      },
      "nishiki-market": {
        description:
          "寺院巡りの合間の休憩に最適な、細長い食の市場。",
        bestTime: ["午前遅く"]
      },
      shugakuin: {
        description:
          "京都北東部を見渡す層状の眺めが魅力の優雅な離宮庭園。ゆっくり鑑賞するのに最適。",
        bestTime: ["朝"]
      }
    },
    category: {
      temple: "寺",
      shrine: "神社",
      garden: "庭園",
      street: "通り",
      district: "地区",
      nature: "自然",
      viewpoint: "展望",
      market: "市場",
      museum: "博物館"
    },
    tag: {
      "must-visit": "必見",
      photographer: "写真向き",
      "first-visit": "初回向け",
      nature: "自然",
      autumn: "紅葉",
      sakura: "桜",
      "hidden-gem": "穴場",
      sunrise: "日の出",
      night: "夜",
      rain: "雨天",
      "public-transport": "公共交通",
      "light-trekking": "軽い山歩き"
    },
    difficulty: {
      easy: "簡単",
      moderate: "普通",
      active: "上級"
    },
    season: {
      spring: "春",
      summer: "夏",
      autumn: "秋",
      winter: "冬"
    },
    auth: {
      login: "ログイン",
      register: "登録",
      logout: "ログアウト",
      account: "マイページ",
      email: "メールアドレス",
      password: "パスワード",
      name: "名前",
      loginTitle: "サインイン",
      registerTitle: "アカウント作成",
      submit: "続ける",
      switchToRegister: "アカウントをお持ちでない方は登録",
      switchToLogin: "アカウントをお持ちの方はログイン",
      savedPlaces: "保存した場所",
      viewedPlaces: "閲覧した場所",
      visitedPlaces: "訪問した場所",
      noSavedPlaces: "保存した場所はまだありません",
      noViewedPlaces: "閲覧した場所はまだありません",
      noVisitedPlaces: "訪問した場所はまだありません",
      memberSince: "登録日",
      chooseAvatar: "アバターを選択",
      changeAvatar: "アバターを変更"
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
    poi.nameByLanguage[language],
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
