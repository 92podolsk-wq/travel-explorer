import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Category } from "@/entities/category/model/types";
import { getCategoryIconComponent, getCategoryImageIconPath } from "@/entities/category/ui/category-icon-options";

export function markerIconId(categoryId: string) {
  return `poi-icon-${categoryId}`;
}

export const visitedBadgeIconId = "poi-visited-badge";

function buildVisitedBadgeSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#287f72" stroke="#ffffff" stroke-width="2"/><path d="M7 12.3l3.1 3.1L17 8.3" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export async function registerVisitedBadgeIcon(map: MapLibreMap) {
  if (map.hasImage(visitedBadgeIconId)) {
    return;
  }

  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildVisitedBadgeSvg())}`;

  await new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!map.hasImage(visitedBadgeIconId)) {
        map.addImage(visitedBadgeIconId, image, { pixelRatio: 2 });
      }
      resolve();
    };
    image.onerror = () => reject(new Error("Failed to load visited badge icon"));
    image.src = svgUrl;
  });
}

function iconInnerMarkup(iconKey: string): string {
  const Icon = getCategoryIconComponent(iconKey);
  const svgString = renderToStaticMarkup(createElement(Icon));
  const match = svgString.match(/^<svg[^>]*>([\s\S]*)<\/svg>$/);
  return match ? match[1] : "";
}

function buildIconSvg(shape: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
}

// The map draws a colored circle behind every marker icon (see explorer-map's
// "circle-color": ["get", "color"] paint layer), so registered sprites are
// expected to be a transparent-background glyph, not a filled badge. Brand
// logos like the BookOff icon come as an opaque circle on a white square —
// this strips the white/light background down to alpha so the glyph
// composites onto that circle the same way every line-icon does.
function extractWhiteGlyphDataUrl(image: HTMLImageElement, sizePx: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(image, 0, 0, sizePx, sizePx);
  const imageData = ctx.getImageData(0, 0, sizePx, sizePx);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (brightness > 200) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image icon "${src}"`));
    image.src = src;
  });
}

export async function registerCategoryMarkerIcons(map: MapLibreMap, categories: Category[]) {
  await Promise.all(
    categories.map(async (category) => {
      const id = markerIconId(category.id);

      if (map.hasImage(id)) {
        return;
      }

      const imagePath = getCategoryImageIconPath(category.icon);
      const iconUrl = imagePath
        ? extractWhiteGlyphDataUrl(await loadImageElement(imagePath), 96)
        : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildIconSvg(iconInnerMarkup(category.icon)))}`;

      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (!map.hasImage(id)) {
            map.addImage(id, image, { pixelRatio: 2 });
          }
          resolve();
        };
        image.onerror = () => reject(new Error(`Failed to load marker icon for category "${category.id}"`));
        image.src = iconUrl;
      });
    })
  );
}
