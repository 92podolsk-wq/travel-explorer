import type { Region } from "./types";

export const osakaRegion: Region = {
  id: "osaka",
  name: "Osaka",
  areaId: "kansai",
  center: {
    lat: 34.6937,
    lng: 135.5023
  },
  defaultZoom: 12,
  bounds: [
    [135.35, 34.55],
    [135.65, 34.85]
  ],
  timezoneOffsetHours: 9,
  nameByLanguage: {
    en: "Osaka",
    ru: "Осака",
    ja: "大阪"
  },
  sealCharacter: "阪",
  status: "published"
};
