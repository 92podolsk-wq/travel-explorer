import type { Coordinates } from "@/entities/poi/model/types";

export function buildGoogleMapsUrl(points: { coordinates: Coordinates }[]) {
  if (points.length === 0) {
    return null;
  }

  if (points.length === 1) {
    const { lat, lng } = points[0].coordinates;
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const path = points.map((point) => `${point.coordinates.lat},${point.coordinates.lng}`).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}
