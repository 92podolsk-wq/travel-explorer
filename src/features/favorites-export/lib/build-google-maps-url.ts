import type { Poi } from "@/entities/poi/model/types";

export function buildGoogleMapsUrl(pois: Poi[]) {
  if (pois.length === 0) {
    return null;
  }

  if (pois.length === 1) {
    const { lat, lng } = pois[0].coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const path = pois.map((poi) => `${poi.coordinates.lat},${poi.coordinates.lng}`).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}
