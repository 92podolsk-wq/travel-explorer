import type { Poi } from "@/entities/poi/model/types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildFavoritesKml(pois: Poi[], documentName: string) {
  const placemarks = pois
    .map(
      (poi) => `    <Placemark>
      <name>${escapeXml(poi.name)}</name>
      <description>${escapeXml(poi.description)}</description>
      <Point>
        <coordinates>${poi.coordinates.lng},${poi.coordinates.lat},0</coordinates>
      </Point>
    </Placemark>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(documentName)}</name>
${placemarks}
  </Document>
</kml>
`;
}
