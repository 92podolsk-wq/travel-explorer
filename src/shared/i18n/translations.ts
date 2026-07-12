import type { Difficulty, Poi, PoiCategory, PoiTag, Season } from "@/entities/poi/model/types";
import type { Language } from "./types";

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
    hoursShort: string;
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
    modeFilters: string;
    seasonFilter: string;
    noSeasonPhotoHint: string;
    tomorrow: string;
    now: string;
    previousPlace: string;
    nextPlace: string;
    nearMe: string;
    nearMeHint: string;
    locating: string;
    locationError: string;
    seasonReminder: string;
    seasonReminderToday: string;
    swipeDiscovery: string;
    swipeDiscoveryHint: string;
    swipeEmpty: string;
    swipeLike: string;
    swipeSkip: string;
    swipeProgress: string;
    swipeClose: string;
    swipeContinueHint: string;
    swipeContinueIn: string;
    cookieConsentText: string;
    cookieConsentAccept: string;
    auto: string;
    on: string;
    off: string;
  };
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
    clearViewed: string;
    clearViewedConfirm: string;
    clearSaved: string;
    clearSavedConfirm: string;
    clearVisited: string;
    clearVisitedConfirm: string;
    cancel: string;
    myItinerary: string;
    itineraryEmpty: string;
    addToItinerary: string;
    addAllToItinerary: string;
    addRegionToItinerary: string;
    inItinerary: string;
    removeFromItinerary: string;
    clearItinerary: string;
    clearItineraryConfirm: string;
    shareItinerary: string;
    linkCopied: string;
    dayLabel: string;
    generateItinerary: string;
    generateItineraryDays: string;
    generateItineraryHoursPerDay: string;
    generateItinerarySourceFavorites: string;
    generateItinerarySourceRecommended: string;
    generateItinerarySubmit: string;
    generateItineraryConfirm: string;
    generateItineraryEmpty: string;
    downloadPdf: string;
    dayStart: string;
    dayEnd: string;
    lunchBreak: string;
    addDay: string;
    removeDay: string;
    removeDayConfirm: string;
    optimizeDay: string;
    dayPlaceCount: string;
    dayWalkingDistance: string;
    dayEmptyPlaceholder: string;
    renameDayPlaceholder: string;
    newItinerary: string;
    deleteItinerary: string;
    deleteItineraryConfirm: string;
    maxItinerariesReached: string;
    switchItinerary: string;
    stopDuration: string;
    stopDurationCustom: string;
    resetDuration: string;
    dayStartTime: string;
    lunchToggleLabel: string;
    lunchStartTime: string;
    lunchDuration: string;
    tabRoute: string;
    tabSaved: string;
    tabHistory: string;
  };
  report: {
    cta: string;
    title: string;
    placeholder: string;
    submit: string;
    sending: string;
    cancel: string;
    thanks: string;
    close: string;
    error: string;
  };
};

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    app: {
      searchAria: "Search places",
      searchPlaceholder: "Search places",
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
      hoursShort: "h",
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
      modeFilters: "Filters",
      seasonFilter: "Season",
      noSeasonPhotoHint: "No photo for this season — showing the default one",
      tomorrow: "Tomorrow",
      now: "Now",
      previousPlace: "Previous",
      nextPlace: "Next",
      nearMe: "Near me",
      nearMeHint: "Sort places by distance from your location",
      locating: "Locating…",
      locationError: "Couldn't get your location. Check your browser's location permission.",
      seasonReminder: "{season} season starts in {city} in {days} days",
      seasonReminderToday: "{season} season starts today in {city}",
      swipeDiscovery: "Quick picks",
      swipeDiscoveryHint: "Swipe through places: like to save, skip to mark as seen",
      swipeEmpty: "You've gone through every place here.",
      swipeLike: "Like",
      swipeSkip: "Skip",
      swipeProgress: "{current} of {total}",
      swipeClose: "Close",
      swipeContinueHint: "Keep swiping nearby",
      swipeContinueIn: "{region} · {count} places",
      cookieConsentText:
        "We use cookies and local storage to remember your language and selected city, and to keep you signed in.",
      cookieConsentAccept: "Accept",
      auto: "Auto",
      on: "On",
      off: "Off"
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
      museum: "museum",
      restaurant: "restaurant",
      residential: "residential",
      landmark: "landmark"
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
      changeAvatar: "Change avatar",
      clearViewed: "Clear viewed",
      clearViewedConfirm: "Clear all viewed places? This can't be undone.",
      clearSaved: "Clear saved",
      clearSavedConfirm: "Clear all saved places? This can't be undone.",
      clearVisited: "Clear visited",
      clearVisitedConfirm: "Clear all visited places? This can't be undone.",
      cancel: "Cancel",
      myItinerary: "My itinerary",
      itineraryEmpty: "Add places from your favorites to build an itinerary.",
      addToItinerary: "Add to itinerary",
      addAllToItinerary: "Add all to itinerary",
      addRegionToItinerary: "Add all in this region to itinerary",
      inItinerary: "In itinerary",
      removeFromItinerary: "Remove",
      clearItinerary: "Clear itinerary",
      clearItineraryConfirm: "Remove all places from the itinerary? This can't be undone.",
      shareItinerary: "Share",
      linkCopied: "Link copied",
      dayLabel: "Day {n}",
      generateItinerary: "Auto-generate",
      generateItineraryDays: "Days",
      generateItineraryHoursPerDay: "Hours per day",
      generateItinerarySourceFavorites: "From favorites",
      generateItinerarySourceRecommended: "Recommended places",
      generateItinerarySubmit: "Generate",
      generateItineraryConfirm: "This will replace your current itinerary. Continue?",
      generateItineraryEmpty: "No places found for these settings.",
      downloadPdf: "Download PDF",
      dayStart: "Start of day",
      dayEnd: "End of day",
      lunchBreak: "Lunch",
      addDay: "Add day",
      removeDay: "Remove day",
      removeDayConfirm: "Remove this day and all its stops? This can't be undone.",
      optimizeDay: "Optimize",
      dayPlaceCount: "{count} places",
      dayWalkingDistance: "{distance} walking",
      dayEmptyPlaceholder: "No stops yet — add places from your favorites.",
      renameDayPlaceholder: "Day title",
      newItinerary: "+ New itinerary",
      deleteItinerary: "Delete itinerary",
      deleteItineraryConfirm: "Delete this itinerary? This can't be undone.",
      maxItinerariesReached: "You've reached the limit of 3 itineraries.",
      switchItinerary: "Switch itinerary",
      stopDuration: "Duration",
      stopDurationCustom: "Custom",
      resetDuration: "Reset to default",
      dayStartTime: "Day starts at",
      lunchToggleLabel: "Lunch break",
      lunchStartTime: "Lunch at",
      lunchDuration: "Lunch duration",
      tabRoute: "Route",
      tabSaved: "Saved",
      tabHistory: "History"
    },
    report: {
      cta: "Found an inaccuracy in this description?",
      title: "Report an inaccuracy",
      placeholder: "Describe what's inaccurate...",
      submit: "Send",
      sending: "Sending…",
      cancel: "Cancel",
      thanks: "Thanks for the feedback! We'll take a look soon.",
      close: "Close",
      error: "Couldn't send it. Please try again."
    }
  },
  ru: {
    app: {
      searchAria: "Поиск мест",
      searchPlaceholder: "Поиск мест",
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
      hoursShort: "ч",
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
      modeFilters: "Фильтры",
      seasonFilter: "Сезон",
      noSeasonPhotoHint: "Нет фото для этого сезона — показано стандартное",
      tomorrow: "Завтра",
      now: "Сейчас",
      previousPlace: "Назад",
      nextPlace: "Далее",
      nearMe: "Рядом со мной",
      nearMeHint: "Сортировать места по расстоянию от вас",
      locating: "Определяем местоположение…",
      locationError: "Не удалось определить местоположение. Проверьте разрешение геолокации в браузере.",
      seasonReminder: "Через {days} дн. в {city} начинается сезон: {season}",
      seasonReminderToday: "Сегодня в {city} начинается сезон: {season}",
      swipeDiscovery: "Быстрый выбор",
      swipeDiscoveryHint: "Пролистайте места: нравится — сохранить, пропустить — отметить просмотренным",
      swipeEmpty: "Вы просмотрели все места здесь.",
      swipeLike: "Нравится",
      swipeSkip: "Пропустить",
      swipeProgress: "{current} из {total}",
      swipeClose: "Закрыть",
      swipeContinueHint: "Продолжить в соседних городах",
      swipeContinueIn: "{region} · {count} мест",
      cookieConsentText:
        "Мы используем куки и локальное хранилище, чтобы запоминать язык и выбранный город, а также сохранять вход в аккаунт.",
      cookieConsentAccept: "Принять",
      auto: "Авто",
      on: "Вкл",
      off: "Выкл"
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
      museum: "музей",
      restaurant: "ресторан",
      residential: "жилой дом",
      landmark: "достопримечательность"
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
      changeAvatar: "Сменить аватар",
      clearViewed: "Очистить",
      clearViewedConfirm: "Очистить все просмотренные места? Это действие нельзя отменить.",
      clearSaved: "Очистить",
      clearSavedConfirm: "Очистить все сохранённые места? Это действие нельзя отменить.",
      clearVisited: "Очистить",
      clearVisitedConfirm: "Очистить все посещённые места? Это действие нельзя отменить.",
      cancel: "Отмена",
      myItinerary: "Мой маршрут",
      itineraryEmpty: "Добавьте места из избранного, чтобы построить маршрут.",
      addToItinerary: "В маршрут",
      addAllToItinerary: "Добавить все в маршрут",
      addRegionToItinerary: "Добавить все места этого региона в маршрут",
      inItinerary: "В маршруте",
      removeFromItinerary: "Убрать",
      clearItinerary: "Очистить маршрут",
      clearItineraryConfirm: "Удалить все места из маршрута? Это действие нельзя отменить.",
      shareItinerary: "Поделиться",
      linkCopied: "Ссылка скопирована",
      dayLabel: "День {n}",
      generateItinerary: "Автосоставить маршрут",
      generateItineraryDays: "Дней",
      generateItineraryHoursPerDay: "Часов в день",
      generateItinerarySourceFavorites: "Из избранного",
      generateItinerarySourceRecommended: "Рекомендованные места",
      generateItinerarySubmit: "Составить",
      generateItineraryConfirm: "Это заменит текущий маршрут. Продолжить?",
      generateItineraryEmpty: "Не нашлось мест под эти настройки.",
      downloadPdf: "Скачать PDF",
      dayStart: "Начало дня",
      dayEnd: "Конец дня",
      lunchBreak: "Обед",
      addDay: "Добавить день",
      removeDay: "Удалить день",
      removeDayConfirm: "Удалить этот день и все его точки? Это действие нельзя отменить.",
      optimizeDay: "Оптимизировать",
      dayPlaceCount: "{count} мест",
      dayWalkingDistance: "{distance} пешком",
      dayEmptyPlaceholder: "Пока нет точек — добавьте места из избранного.",
      renameDayPlaceholder: "Название дня",
      newItinerary: "+ Новый маршрут",
      deleteItinerary: "Удалить маршрут",
      deleteItineraryConfirm: "Удалить этот маршрут? Это действие нельзя отменить.",
      maxItinerariesReached: "Достигнут лимит в 3 маршрута.",
      switchItinerary: "Переключить маршрут",
      stopDuration: "Длительность",
      stopDurationCustom: "Своё",
      resetDuration: "Сбросить по умолчанию",
      dayStartTime: "Начало дня в",
      lunchToggleLabel: "Обеденный перерыв",
      lunchStartTime: "Обед в",
      lunchDuration: "Длительность обеда",
      tabRoute: "Маршрут",
      tabSaved: "Избранное",
      tabHistory: "История"
    },
    report: {
      cta: "Нашли неточность в описании локации?",
      title: "Сообщить о неточности",
      placeholder: "Опишите, в чём заключается неточность...",
      submit: "Отправить",
      sending: "Отправка…",
      cancel: "Отмена",
      thanks: "Спасибо за обратную связь! Мы скоро всё проверим.",
      close: "Закрыть",
      error: "Не удалось отправить. Попробуйте ещё раз."
    }
  },
  ja: {
    app: {
      searchAria: "場所を検索",
      searchPlaceholder: "場所を検索",
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
      hoursShort: "時間",
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
      modeFilters: "フィルター",
      seasonFilter: "季節",
      noSeasonPhotoHint: "この季節の写真がありません — デフォルトを表示",
      tomorrow: "明日",
      now: "現在",
      previousPlace: "前へ",
      nextPlace: "次へ",
      nearMe: "現在地の近く",
      nearMeHint: "現在地からの距離で並び替え",
      locating: "位置情報を取得中…",
      locationError: "現在地を取得できませんでした。ブラウザの位置情報の許可を確認してください。",
      seasonReminder: "あと{days}日で{city}で{season}シーズンが始まります",
      seasonReminderToday: "本日{city}で{season}シーズンが始まります",
      swipeDiscovery: "クイック選択",
      swipeDiscoveryHint: "場所をスワイプ:気に入ったら保存、スキップで既読に",
      swipeEmpty: "ここにある場所はすべて確認しました。",
      swipeLike: "気に入り",
      swipeSkip: "スキップ",
      swipeProgress: "{total}件中{current}件目",
      swipeClose: "閉じる",
      swipeContinueHint: "近くの街で続ける",
      swipeContinueIn: "{region} ・ {count}件",
      cookieConsentText: "言語や選択した都市を記憶し、ログイン状態を保つためにクッキーとローカルストレージを使用しています。",
      cookieConsentAccept: "同意する",
      auto: "自動",
      on: "オン",
      off: "オフ"
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
      museum: "博物館",
      restaurant: "レストラン",
      residential: "住宅",
      landmark: "ランドマーク"
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
      changeAvatar: "アバターを変更",
      clearViewed: "履歴を消去",
      clearViewedConfirm: "閲覧履歴をすべて消去しますか?この操作は元に戻せません。",
      clearSaved: "消去",
      clearSavedConfirm: "保存した場所をすべて消去しますか?この操作は元に戻せません。",
      clearVisited: "消去",
      clearVisitedConfirm: "訪問した場所をすべて消去しますか?この操作は元に戻せません。",
      cancel: "キャンセル",
      myItinerary: "自分のルート",
      itineraryEmpty: "お気に入りから場所を追加してルートを作成しましょう。",
      addToItinerary: "ルートに追加",
      addAllToItinerary: "すべてルートに追加",
      addRegionToItinerary: "この地域の場所をすべてルートに追加",
      inItinerary: "ルートに追加済み",
      removeFromItinerary: "削除",
      clearItinerary: "ルートを消去",
      clearItineraryConfirm: "ルートからすべての場所を削除しますか?この操作は元に戻せません。",
      shareItinerary: "共有",
      linkCopied: "リンクをコピーしました",
      dayLabel: "{n}日目",
      generateItinerary: "ルートを自動作成",
      generateItineraryDays: "日数",
      generateItineraryHoursPerDay: "1日の時間",
      generateItinerarySourceFavorites: "お気に入りから",
      generateItinerarySourceRecommended: "おすすめの場所",
      generateItinerarySubmit: "作成する",
      generateItineraryConfirm: "現在のルートは置き換えられます。続けますか?",
      generateItineraryEmpty: "この条件に合う場所が見つかりませんでした。",
      downloadPdf: "PDFをダウンロード",
      dayStart: "開始",
      dayEnd: "終了",
      lunchBreak: "昼食",
      addDay: "日を追加",
      removeDay: "日を削除",
      removeDayConfirm: "この日とすべての立ち寄り先を削除しますか?この操作は元に戻せません。",
      optimizeDay: "最適化",
      dayPlaceCount: "{count}件",
      dayWalkingDistance: "徒歩{distance}",
      dayEmptyPlaceholder: "まだ立ち寄り先がありません。お気に入りから追加してください。",
      renameDayPlaceholder: "この日のタイトル",
      newItinerary: "+ 新しい旅程",
      deleteItinerary: "旅程を削除",
      deleteItineraryConfirm: "この旅程を削除しますか?この操作は元に戻せません。",
      maxItinerariesReached: "旅程は最大3件までです。",
      switchItinerary: "旅程を切り替え",
      stopDuration: "滞在時間",
      stopDurationCustom: "カスタム",
      resetDuration: "デフォルトに戻す",
      dayStartTime: "開始時刻",
      lunchToggleLabel: "昼食休憩",
      lunchStartTime: "昼食の時刻",
      lunchDuration: "昼食の長さ",
      tabRoute: "旅程",
      tabSaved: "お気に入り",
      tabHistory: "履歴"
    },
    report: {
      cta: "この説明に誤りがありましたか?",
      title: "誤りを報告",
      placeholder: "誤りの内容を記入してください...",
      submit: "送信",
      sending: "送信中…",
      cancel: "キャンセル",
      thanks: "フィードバックありがとうございます!近日中に確認します。",
      close: "閉じる",
      error: "送信できませんでした。もう一度お試しください。"
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
