import type { Map as MapLibreMap } from "maplibre-gl";
import type { PoiMainCategory } from "@/entities/poi/model/types";

const categoryShapeMarkup: Record<PoiMainCategory, string> = {
  nature:
    '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>',
  temples:
    '<path d="M10 9h4"/><path d="M12 7v5"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.618a1 1 0 0 0-.553-.894l-4.553-2.277a2 2 0 0 0-1.788 0L6.553 4.724A1 1 0 0 0 6 5.618V22"/><path d="m18 7 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.618a1 1 0 0 1 .553-.894L6 7"/>',
  castles:
    '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-3-3a3 3 0 0 0-3 3v4"/><path d="M22 11V9"/><path d="M2 11V9"/><path d="M6 4V2"/><path d="M18 4V2"/><path d="M10 4V2"/><path d="M14 4V2"/>',
  museums:
    '<circle cx="12" cy="10" r="1"/><path d="M22 20V8h-4l-6-4-6 4H2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2"/><path d="M6 17v.01"/><path d="M6 13v.01"/><path d="M18 17v.01"/><path d="M18 13v.01"/><path d="M14 22v-5a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5"/>',
  urban:
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  viewpoints:
    '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  entertainment:
    '<circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><path d="M18 18.7a9 9 0 1 0-12 0"/>',
  gardens:
    '<path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1"/><circle cx="12" cy="8" r="2"/><path d="M12 10v12"/><path d="M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z"/><path d="M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z"/>',
  monuments:
    '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  unique:
    '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>'
};

export const categoryMarkerColors: Record<PoiMainCategory, string> = {
  nature: "#2f8f8a",
  temples: "#d1495b",
  castles: "#a4694a",
  museums: "#6b5b95",
  urban: "#5b6ee1",
  viewpoints: "#e0a13e",
  entertainment: "#c1440e",
  gardens: "#4c9a63",
  monuments: "#8a7355",
  unique: "#b5651d"
};

export function markerIconId(category: PoiMainCategory) {
  return `poi-icon-${category}`;
}

function buildIconSvg(shape: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
}

export async function registerCategoryMarkerIcons(map: MapLibreMap) {
  const entries = Object.entries(categoryShapeMarkup) as Array<[PoiMainCategory, string]>;

  await Promise.all(
    entries.map(([category, shape]) => {
      const id = markerIconId(category);

      if (map.hasImage(id)) {
        return Promise.resolve();
      }

      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildIconSvg(shape))}`;

      return new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (!map.hasImage(id)) {
            map.addImage(id, image, { pixelRatio: 2 });
          }
          resolve();
        };
        image.onerror = () => reject(new Error(`Failed to load marker icon for category "${category}"`));
        image.src = svgUrl;
      });
    })
  );
}
