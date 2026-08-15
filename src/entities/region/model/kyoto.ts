import type { Region } from "./types";

export const kyotoRegion: Region = {
  id: "kyoto",
  name: "Kyoto",
  areaId: "kansai",
  center: {
    lat: 35.0116,
    lng: 135.7681
  },
  defaultZoom: 11,
  bounds: [
    [135.56, 34.86],
    [135.91, 35.16]
  ],
  timezoneOffsetHours: 9,
  nameByLanguage: {
    en: "Kyoto",
    ru: "Киото"
  },
  sealCharacter: "京",
  status: "published"
};
