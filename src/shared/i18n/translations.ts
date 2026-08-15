import type { Difficulty, Poi, PoiTag, Season } from "@/entities/poi/model/types";
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
    viewed: string;
    save: string;
    photo: string;
    best: string;
    duration: string;
    effort: string;
    bestTime: string;
    signals: string;
    minutesShort: string;
    hoursShort: string;
    language: string;
    theme: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    region: string;
    country: string;
    area: string;
    city: string;
    hideDetails: string;
    showDetails: string;
    collapseSidebar: string;
    expandSidebar: string;
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
    categoryFilter: string;
    noResultsTitle: string;
    noResultsHint: string;
    resetFilters: string;
    share: string;
    linkCopied: string;
    mobileNavMap: string;
    offlineMapDownload: string;
    offlineMapDownloading: string;
    offlineMapDownloaded: string;
    offlineMapError: string;
    offlineMessage: string;
    offlineMapsManageTitle: string;
    offlineMapsManageEmpty: string;
    offlineMapsManageDelete: string;
    offlineMapsManageDeleted: string;
    offlineFirstLaunchTitle: string;
    offlineFirstLaunchHint: string;
    checklistCardTitle: string;
    checklistSetDate: string;
    checklistDateSet: string;
    checklistPackingTitle: string;
    checklistShoppingTitle: string;
    checklistAddPlaceholder: string;
    retryButton: string;
    noSeasonPhotoHint: string;
    tomorrow: string;
    now: string;
    previousPlace: string;
    nextPlace: string;
    nearMe: string;
    nearMeHint: string;
    locateMeHint: string;
    addMarkerHint: string;
    addMarkerModeHint: string;
    newMarkerTitle: string;
    markerLabelPlaceholder: string;
    markerCountLabel: string;
    markerLimitReached: string;
    markerSaveError: string;
    markerCancel: string;
    markerSave: string;
    markerSaving: string;
    markerDeleteLabel: string;
    markerStopFallbackName: string;
    addMarkerToItinerary: string;
    removeMarkerFromItinerary: string;
    locating: string;
    locationError: string;
    seasonReminder: string;
    seasonReminderToday: string;
    swipeDiscovery: string;
    swipeDiscoveryHint: string;
    swipeAffinityIntro: string;
    swipeEmpty: string;
    swipeLike: string;
    swipeSkip: string;
    swipeProgress: string;
    swipeClose: string;
    swipeContinueHint: string;
    swipeContinueIn: string;
    cookieConsentText: string;
    cookieConsentAccept: string;
    on: string;
    off: string;
  };
  poi: Record<string, PoiCopy>;
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
    username: string;
    usernameHint: string;
    editProfile: string;
    save: string;
    profileUpdated: string;
    hideFromSearch: string;
    friendsTitle: string;
    friendsSearchPlaceholder: string;
    friendsSearching: string;
    friendsNoResults: string;
    friendsAdd: string;
    friendsAlreadyFriends: string;
    friendsRequestSent: string;
    friendsRespondBelow: string;
    friendsIncomingTitle: string;
    friendsAccept: string;
    friendsDecline: string;
    friendsOutgoingTitle: string;
    friendsCancel: string;
    friendsListTitle: string;
    friendsLoading: string;
    friendsEmpty: string;
    friendsRemove: string;
    shareChecklist: string;
    sharedChecklistsTitle: string;
    shareItineraryWithFriend: string;
    shareItineraryTitle: string;
    sharedItinerariesTitle: string;
    sharedWithMe: string;
    loginTitle: string;
    registerTitle: string;
    submit: string;
    switchToRegister: string;
    switchToLogin: string;
    continueWith: string;
    loginWithYandex: string;
    yandexError: string;
    savedPlaces: string;
    viewedPlaces: string;
    visitedPlaces: string;
    noSavedPlaces: string;
    noViewedPlaces: string;
    noVisitedPlaces: string;
    memberSince: string;
    chooseAvatar: string;
    changeAvatar: string;
    travelerBadge: string;
    statsSaved: string;
    statsRoutes: string;
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
    favoritesStatsSaved: string;
    favoritesStatsRegions: string;
    favoritesStatsDays: string;
    favoritesStatsDaysHint: string;
    favoritesStatsDaysUnit: string;
    favoritesCtaTitle: string;
    favoritesCtaBody: string;
    favoritesCtaButton: string;
    favoritesProgressTitle: string;
    favoritesProgressViewAll: string;
    favoritesProgressPlacesUnit: string;
    favoritesMapOpen: string;
    removeFromFavorites: string;
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
    tabProfile: string;
    pushNotificationsTitle: string;
    pushNotificationsEnabled: string;
    pushNotificationsDisabled: string;
    pushNotificationsEnable: string;
    pushNotificationsDenied: string;
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
  photoUpload: {
    cta: string;
    title: string;
    hint: string;
    submit: string;
    uploading: string;
    cancel: string;
    success: string;
    close: string;
    errorTooLarge: string;
    errorInvalidType: string;
    errorUserLimit: string;
    errorSiteLimit: string;
    errorGeneric: string;
  };
  welcome: {
    heroTitle: string;
    heroSubtitle: string;
    heroExploreCta: string;
    heroHowItWorksCta: string;
    statsPlaces: string;
    statsRegions: string;
    statsModes: string;
    statsInfinity: string;
    placesUnit: string;
    destinationsTitle: string;
    modesTitle: string;
    itineraryTitle: string;
    itineraryBody: string;
    itineraryCta: string;
    galleryTitle: string;
    gallerySubtitle: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
    step5Title: string;
    step5Body: string;
  };
  trip: {
    sharedRouteLabel: string;
    travelTimeSummary: string;
    openInGoogleMaps: string;
    empty: string;
    stopDurationOnSite: string;
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
      viewed: "viewed",
      save: "Save",
      photo: "Photo",
      best: "Best",
      duration: "Duration",
      effort: "Effort",
      bestTime: "Best Time",
      signals: "Signals",
      minutesShort: "m",
      hoursShort: "h",
      language: "Language",
      theme: "Theme",
      themeLight: "Light",
      themeDark: "Dark",
      themeSystem: "System",
      region: "Region",
      country: "Country",
      area: "Area",
      city: "City",
      hideDetails: "Hide details",
      showDetails: "Show details",
      collapseSidebar: "Collapse panel",
      expandSidebar: "Expand panel",
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
      categoryFilter: "Category",
      noResultsTitle: "No places found",
      noResultsHint: "Try a different search or reset your filters.",
      resetFilters: "Reset filters",
      share: "Share",
      linkCopied: "Link copied",
      mobileNavMap: "Map",
      offlineMapDownload: "Download offline",
      offlineMapDownloading: "Downloading",
      offlineMapDownloaded: "Downloaded",
      offlineMapError: "Download failed",
      offlineMessage: "No internet connection",
      offlineMapsManageTitle: "Downloaded maps",
      offlineMapsManageEmpty: "No maps downloaded yet",
      offlineMapsManageDelete: "Delete downloaded maps",
      offlineMapsManageDeleted: "Downloaded maps deleted",
      offlineFirstLaunchTitle: "No internet connection",
      offlineFirstLaunchHint: "Connect to the internet at least once to load the map.",
      checklistCardTitle: "Packing checklist",
      checklistSetDate: "Set trip date",
      checklistDateSet: "Trip on {date}",
      checklistPackingTitle: "To pack",
      checklistShoppingTitle: "To buy",
      checklistAddPlaceholder: "Add an item",
      retryButton: "Try again",
      noSeasonPhotoHint: "No photo for this season — showing the default one",
      tomorrow: "Tomorrow",
      now: "Now",
      previousPlace: "Previous",
      nextPlace: "Next",
      nearMe: "Near me",
      nearMeHint: "Sort places by distance from your location",
      locateMeHint: "Show my location on the map",
      addMarkerHint: "Add your own marker",
      addMarkerModeHint: "Click on the map to place a marker",
      newMarkerTitle: "New marker",
      markerLabelPlaceholder: "Label (optional)",
      markerCountLabel: "{count} / {limit} markers",
      markerLimitReached: "Marker limit reached ({limit} markers)",
      markerSaveError: "Couldn't save the marker. Try again.",
      markerCancel: "Cancel",
      markerSave: "Save",
      markerSaving: "Saving…",
      markerDeleteLabel: "Delete",
      markerStopFallbackName: "Custom point",
      addMarkerToItinerary: "Add to itinerary",
      removeMarkerFromItinerary: "Remove from itinerary",
      locating: "Locating…",
      locationError: "Couldn't get your location. Check your browser's location permission.",
      seasonReminder: "{season} season starts in {city} in {days} days",
      seasonReminderToday: "{season} season starts today in {city}",
      swipeDiscovery: "Quick picks",
      swipeDiscoveryHint: "Swipe through places: like to save, skip to mark as seen",
      swipeAffinityIntro: "You love:",
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
      username: "Username",
      usernameHint: "3-20 characters: letters, numbers, underscore",
      editProfile: "Edit profile",
      save: "Save",
      profileUpdated: "Profile updated",
      hideFromSearch: "Don't show me in friend search",
      friendsTitle: "Friends",
      friendsSearchPlaceholder: "Search by username",
      friendsSearching: "Searching…",
      friendsNoResults: "No users found",
      friendsAdd: "Add",
      friendsAlreadyFriends: "Already friends",
      friendsRequestSent: "Request sent",
      friendsRespondBelow: "Respond below",
      friendsIncomingTitle: "Friend requests",
      friendsAccept: "Accept",
      friendsDecline: "Decline",
      friendsOutgoingTitle: "Sent requests",
      friendsCancel: "Cancel",
      friendsListTitle: "Your friends",
      friendsLoading: "Loading…",
      friendsEmpty: "No friends yet",
      friendsRemove: "Remove",
      shareChecklist: "Share",
      sharedChecklistsTitle: "Checklists shared with you",
      shareItineraryWithFriend: "Share",
      shareItineraryTitle: "Share this route",
      sharedItinerariesTitle: "Routes shared with you",
      sharedWithMe: "Shared with me",
      loginTitle: "Sign in",
      registerTitle: "Create an account",
      submit: "Continue",
      switchToRegister: "No account yet? Register",
      switchToLogin: "Already have an account? Log in",
      continueWith: "or continue with",
      loginWithYandex: "Sign in with Yandex",
      yandexError: "Couldn't sign in with Yandex.",
      savedPlaces: "Saved places",
      viewedPlaces: "Viewed places",
      visitedPlaces: "Visited places",
      noSavedPlaces: "No saved places yet",
      noViewedPlaces: "No viewed places yet",
      noVisitedPlaces: "No visited places yet",
      memberSince: "Member since",
      chooseAvatar: "Choose an avatar",
      changeAvatar: "Change avatar",
      travelerBadge: "Traveler",
      statsSaved: "Saved",
      statsRoutes: "Routes",
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
      favoritesStatsSaved: "Places saved",
      favoritesStatsRegions: "Regions",
      favoritesStatsDays: "Enough for a trip",
      favoritesStatsDaysHint: "Estimated from average visit time at {hoursPerDay}h of sightseeing per day",
      favoritesStatsDaysUnit: "days",
      favoritesCtaTitle: "Great!",
      favoritesCtaBody: "You have enough places for a {days}-day trip.",
      favoritesCtaButton: "Build itinerary",
      favoritesProgressTitle: "Progress by region",
      favoritesProgressViewAll: "View all regions",
      favoritesProgressPlacesUnit: "places",
      favoritesMapOpen: "Open map",
      removeFromFavorites: "Remove from saved",
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
      tabHistory: "History",
      tabProfile: "Profile",
      pushNotificationsTitle: "Push notifications",
      pushNotificationsEnabled: "Notifications are on",
      pushNotificationsDisabled: "Notifications are off",
      pushNotificationsEnable: "Enable notifications",
      pushNotificationsDenied: "Notifications are blocked in phone settings"
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
    },
    photoUpload: {
      cta: "Add a photo",
      title: "Upload a photo",
      hint: "JPEG, PNG or WebP, up to 10MB. Your photo will be reviewed before it appears on the site.",
      submit: "Upload",
      uploading: "Uploading…",
      cancel: "Cancel",
      success: "Thanks! Your photo was submitted for moderation.",
      close: "Close",
      errorTooLarge: "The file is too large — max 10MB.",
      errorInvalidType: "Unsupported file type — please use JPEG, PNG or WebP.",
      errorUserLimit: "You've reached your daily upload limit ({limit} photos).",
      errorSiteLimit: "The site has reached its daily upload limit — try again tomorrow.",
      errorGeneric: "Couldn't upload the photo. Please try again."
    },
    welcome: {
      heroTitle: "Discover the best places to travel",
      heroSubtitle: "Every place, every shot, every moment. Plan the perfect trip with Wayora.",
      heroExploreCta: "Explore {region}",
      heroHowItWorksCta: "How it works",
      statsPlaces: "Places in the database",
      statsRegions: "Regions",
      statsModes: "Exploration modes",
      statsInfinity: "Memories",
      placesUnit: "places",
      destinationsTitle: "Popular destinations",
      modesTitle: "Exploration modes",
      itineraryTitle: "Smart routes in minutes",
      itineraryBody: "Automatically build the optimal route based on time, distance and your interests.",
      itineraryCta: "Try it",
      galleryTitle: "Get inspired by the best shots",
      gallerySubtitle: "Real photos from real places to help you find the perfect angle.",
      howItWorksTitle: "How it works",
      step1Title: "Pick a destination and mode",
      step1Body: "Choose a city and an exploration mode that fits what you're after.",
      step2Title: "Explore the best places on the map",
      step2Body: "Browse sights on an interactive map with photos and descriptions.",
      step3Title: "Save the places you like",
      step3Body: "Add places to your favorites in one click.",
      step4Title: "Build smart routes",
      step4Body: "Automatically generate a multi-day route based on timing and distance.",
      step5Title: "Enjoy the trip",
      step5Body: "Share your route and discover the best of your destination."
    },
    trip: {
      sharedRouteLabel: "Shared route",
      travelTimeSummary: "{total} min total ({walking} min walking)",
      openInGoogleMaps: "Open route in Google Maps",
      empty: "This route has no places yet.",
      stopDurationOnSite: "{minutes} min on site"
    }
  },
  ru: {
    app: {
      searchAria: "Поиск мест",
      searchPlaceholder: "Поиск мест",
      visible: "видно",
      saved: "сохранено",
      places: "мест",
      viewed: "просмотрено",
      save: "Сохранить",
      photo: "Фото",
      best: "Лучше",
      duration: "Время",
      effort: "Сложность",
      bestTime: "Лучшее время",
      signals: "Признаки",
      minutesShort: "мин",
      hoursShort: "ч",
      language: "Язык",
      theme: "Тема",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      themeSystem: "Как в системе",
      region: "Регион",
      country: "Страна",
      area: "Регион",
      city: "Город",
      hideDetails: "Скрыть панель",
      showDetails: "Показать панель",
      collapseSidebar: "Свернуть панель",
      expandSidebar: "Развернуть панель",
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
      categoryFilter: "Категория",
      noResultsTitle: "Ничего не найдено",
      noResultsHint: "Попробуйте другой запрос или сбросьте фильтры.",
      resetFilters: "Сбросить фильтры",
      share: "Поделиться",
      linkCopied: "Ссылка скопирована",
      mobileNavMap: "Карта",
      offlineMapDownload: "Скачать офлайн",
      offlineMapDownloading: "Скачивание",
      offlineMapDownloaded: "Скачано",
      offlineMapError: "Ошибка скачивания",
      offlineMessage: "Нет подключения к интернету",
      offlineMapsManageTitle: "Скачанные карты",
      offlineMapsManageEmpty: "Пока ничего не скачано",
      offlineMapsManageDelete: "Удалить скачанные карты",
      offlineMapsManageDeleted: "Скачанные карты удалены",
      offlineFirstLaunchTitle: "Нет подключения к интернету",
      offlineFirstLaunchHint: "Подключитесь к интернету хотя бы раз, чтобы загрузить карту.",
      checklistCardTitle: "Чек-лист сборов",
      checklistSetDate: "Указать дату поездки",
      checklistDateSet: "Поездка {date}",
      checklistPackingTitle: "Взять с собой",
      checklistShoppingTitle: "Купить",
      checklistAddPlaceholder: "Добавить пункт",
      retryButton: "Повторить",
      noSeasonPhotoHint: "Нет фото для этого сезона — показано стандартное",
      tomorrow: "Завтра",
      now: "Сейчас",
      previousPlace: "Назад",
      nextPlace: "Далее",
      nearMe: "Рядом со мной",
      nearMeHint: "Сортировать места по расстоянию от вас",
      locateMeHint: "Показать моё местоположение на карте",
      addMarkerHint: "Добавить свою метку",
      addMarkerModeHint: "Кликните на карте, чтобы поставить метку",
      newMarkerTitle: "Новая метка",
      markerLabelPlaceholder: "Название (необязательно)",
      markerCountLabel: "{count} / {limit} меток",
      markerLimitReached: "Достигнут лимит меток ({limit})",
      markerSaveError: "Не удалось сохранить метку. Попробуйте ещё раз.",
      markerCancel: "Отмена",
      markerSave: "Сохранить",
      markerSaving: "Сохранение…",
      markerDeleteLabel: "Удалить",
      markerStopFallbackName: "Своя точка",
      addMarkerToItinerary: "Добавить в маршрут",
      removeMarkerFromItinerary: "Убрать из маршрута",
      locating: "Определяем местоположение…",
      locationError: "Не удалось определить местоположение. Проверьте разрешение геолокации в браузере.",
      seasonReminder: "Через {days} дн. в {city} начинается сезон: {season}",
      seasonReminderToday: "Сегодня в {city} начинается сезон: {season}",
      swipeDiscovery: "Быстрый выбор",
      swipeDiscoveryHint: "Пролистайте места: нравится — сохранить, пропустить — отметить просмотренным",
      swipeAffinityIntro: "Вы любите:",
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
      username: "Логин",
      usernameHint: "3-20 символов: латинские буквы, цифры или подчёркивание",
      editProfile: "Редактировать профиль",
      save: "Сохранить",
      profileUpdated: "Профиль обновлён",
      hideFromSearch: "Не показывать меня в поиске друзей",
      friendsTitle: "Друзья",
      friendsSearchPlaceholder: "Поиск по логину",
      friendsSearching: "Поиск…",
      friendsNoResults: "Пользователи не найдены",
      friendsAdd: "Добавить",
      friendsAlreadyFriends: "Уже друзья",
      friendsRequestSent: "Запрос отправлен",
      friendsRespondBelow: "Ответьте ниже",
      friendsIncomingTitle: "Заявки в друзья",
      friendsAccept: "Принять",
      friendsDecline: "Отклонить",
      friendsOutgoingTitle: "Отправленные заявки",
      friendsCancel: "Отменить",
      friendsListTitle: "Ваши друзья",
      friendsLoading: "Загрузка…",
      friendsEmpty: "Пока нет друзей",
      friendsRemove: "Удалить",
      shareChecklist: "Поделиться",
      sharedChecklistsTitle: "Чек-листы, которыми с вами поделились",
      shareItineraryWithFriend: "Поделиться",
      shareItineraryTitle: "Поделиться маршрутом",
      sharedItinerariesTitle: "Маршруты, которыми с вами поделились",
      sharedWithMe: "Доступно мне",
      loginTitle: "Вход",
      registerTitle: "Создать аккаунт",
      submit: "Продолжить",
      switchToRegister: "Нет аккаунта? Зарегистрироваться",
      switchToLogin: "Уже есть аккаунт? Войти",
      continueWith: "или продолжить через",
      loginWithYandex: "Войти через Яндекс",
      yandexError: "Не удалось войти через Яндекс.",
      savedPlaces: "Сохранённые места",
      viewedPlaces: "Просмотренные места",
      visitedPlaces: "Посещённые места",
      noSavedPlaces: "Пока нет сохранённых мест",
      noViewedPlaces: "Пока нет просмотренных мест",
      noVisitedPlaces: "Пока нет посещённых мест",
      memberSince: "Дата регистрации",
      chooseAvatar: "Выберите аватар",
      changeAvatar: "Сменить аватар",
      travelerBadge: "Путешественник",
      statsSaved: "Избранное",
      statsRoutes: "Маршруты",
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
      favoritesStatsSaved: "Сохранено мест",
      favoritesStatsRegions: "Региона",
      favoritesStatsDays: "Хватит на поездку",
      favoritesStatsDaysHint: "Оценка по среднему времени посещения места и {hoursPerDay} ч осмотра в день",
      favoritesStatsDaysUnit: "дня",
      favoritesCtaTitle: "Отлично!",
      favoritesCtaBody: "У вас достаточно мест для путешествия на {days} дня.",
      favoritesCtaButton: "Составить маршрут",
      favoritesProgressTitle: "Прогресс по регионам",
      favoritesProgressViewAll: "Смотреть все регионы",
      favoritesProgressPlacesUnit: "мест",
      favoritesMapOpen: "Открыть карту",
      removeFromFavorites: "Убрать из избранного",
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
      tabHistory: "История",
      tabProfile: "Профиль",
      pushNotificationsTitle: "Push-уведомления",
      pushNotificationsEnabled: "Уведомления включены",
      pushNotificationsDisabled: "Уведомления выключены",
      pushNotificationsEnable: "Включить уведомления",
      pushNotificationsDenied: "Уведомления заблокированы в настройках телефона"
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
    },
    photoUpload: {
      cta: "Добавить фото",
      title: "Загрузить фото",
      hint: "JPEG, PNG или WebP, до 10 МБ. Фото появится на сайте после проверки модератором.",
      submit: "Загрузить",
      uploading: "Загрузка…",
      cancel: "Отмена",
      success: "Спасибо! Фото отправлено на модерацию.",
      close: "Закрыть",
      errorTooLarge: "Файл слишком большой — максимум 10 МБ.",
      errorInvalidType: "Неподдерживаемый тип файла — используйте JPEG, PNG или WebP.",
      errorUserLimit: "Вы достигли дневного лимита загрузок ({limit} фото).",
      errorSiteLimit: "Достигнут общий дневной лимит загрузок на сайте — попробуйте завтра.",
      errorGeneric: "Не удалось загрузить фото. Попробуйте ещё раз."
    },
    welcome: {
      heroTitle: "Открывайте лучшие места для путешествий",
      heroSubtitle: "Каждое место, каждый кадр, каждый момент. Планируйте идеальное путешествие с Wayora.",
      heroExploreCta: "Исследовать {region}",
      heroHowItWorksCta: "Как это работает",
      statsPlaces: "Мест в базе",
      statsRegions: "Регионов",
      statsModes: "Режима исследования",
      statsInfinity: "Впечатлений",
      placesUnit: "мест",
      destinationsTitle: "Популярные направления",
      modesTitle: "Режимы исследования",
      itineraryTitle: "Умные маршруты за минуты",
      itineraryBody: "Автоматически создаём оптимальный маршрут с учётом времени, расстояний и ваших интересов.",
      itineraryCta: "Попробовать",
      galleryTitle: "Вдохновляйтесь лучшими кадрами",
      gallerySubtitle: "Реальные фото реальных мест помогут вам найти идеальные ракурсы.",
      howItWorksTitle: "Как это работает",
      step1Title: "Выберите направление и режим",
      step1Body: "Выберите город и режим исследования, который подходит именно вам.",
      step2Title: "Исследуйте лучшие места на карте",
      step2Body: "Просматривайте достопримечательности на интерактивной карте с фото и описаниями.",
      step3Title: "Сохраняйте понравившиеся места",
      step3Body: "Добавляйте места в избранное в один клик.",
      step4Title: "Создавайте умные маршруты",
      step4Body: "Автоматически стройте маршрут на несколько дней с учётом времени и расстояний.",
      step5Title: "Наслаждайтесь путешествием",
      step5Body: "Делитесь маршрутом и открывайте лучшее в выбранном направлении."
    },
    trip: {
      sharedRouteLabel: "Общий маршрут",
      travelTimeSummary: "{total} мин в пути (из них {walking} мин пешком)",
      openInGoogleMaps: "Открыть маршрут в Google Maps",
      empty: "В этом маршруте пока нет мест.",
      stopDurationOnSite: "{minutes} мин на месте"
    }
  }
};

export function getTranslations(language: Language) {
  return translations[language];
}

export function getLocalizedPoiSearchText(poi: Poi, language: Language) {
  const dictionary = getTranslations(language);
  const poiCopy = dictionary.poi[poi.id];
  const tags = poi.tags.map((tag) => dictionary.tag[tag]);

  return [
    poi.name,
    poi.nameByLanguage[language],
    poi.description,
    poiCopy?.description,
    dictionary.difficulty[poi.difficulty],
    ...tags,
    ...(poiCopy?.bestTime ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
