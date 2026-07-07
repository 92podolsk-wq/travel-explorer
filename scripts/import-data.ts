import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "pg";

type JsonCountry = { id: string; name: string; nameByLanguage: Record<string, string> };
type JsonArea = { id: string; countryId: string; name: string; nameByLanguage: Record<string, string> };
type JsonRegion = {
  id: string;
  name: string;
  areaId: string;
  center: { lat: number; lng: number };
  defaultZoom: number;
  bounds: [[number, number], [number, number]];
  timezoneOffsetHours: number;
  nameByLanguage: Record<string, string>;
  sealCharacter: string;
};
type JsonPhoto = { id: string; url: string; alt: string; author?: string; season?: string };
type JsonPoi = {
  id: string;
  regionId: string;
  name: string;
  nameByLanguage: Record<string, string>;
  coordinates: { lat: number; lng: number };
  description: string;
  rating: number;
  photos: JsonPhoto[];
  categories: string[];
  tags: string[];
  seasons: string[];
  photoScore: number;
  mustVisit: boolean;
  bestTime: string[];
  difficulty: string;
  durationMinutes: number;
  importance: number;
  visibilityMode: string;
};

function readJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "data", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

function newClient(): Client {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 8_000,
    query_timeout: 8_000,
    connectionTimeoutMillis: 8_000
  });
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = newClient();
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function main() {
  const countries = readJson<JsonCountry[]>("countries.json");
  const areas = readJson<JsonArea[]>("areas.json");
  const regions = readJson<JsonRegion[]>("regions.json");
  const pois = readJson<JsonPoi[]>("pois.json");

  for (const country of countries) {
    await withClient((client) =>
      client.query(
        `INSERT INTO "Country" (id, name, "nameByLanguage") VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name = $2, "nameByLanguage" = $3`,
        [country.id, country.name, JSON.stringify(country.nameByLanguage)]
      )
    );
  }
  console.log(`Imported ${countries.length} countries`);

  for (const area of areas) {
    await withClient((client) =>
      client.query(
        `INSERT INTO "Area" (id, "countryId", name, "nameByLanguage") VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET "countryId" = $2, name = $3, "nameByLanguage" = $4`,
        [area.id, area.countryId, area.name, JSON.stringify(area.nameByLanguage)]
      )
    );
  }
  console.log(`Imported ${areas.length} areas`);

  for (const region of regions) {
    await withClient((client) =>
      client.query(
        `INSERT INTO "Region" (id, "areaId", name, "nameByLanguage", "centerLat", "centerLng", "defaultZoom", bounds, "timezoneOffsetHours", "sealCharacter")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET "areaId" = $2, name = $3, "nameByLanguage" = $4, "centerLat" = $5, "centerLng" = $6, "defaultZoom" = $7, bounds = $8, "timezoneOffsetHours" = $9, "sealCharacter" = $10`,
        [
          region.id,
          region.areaId,
          region.name,
          JSON.stringify(region.nameByLanguage),
          region.center.lat,
          region.center.lng,
          region.defaultZoom,
          JSON.stringify(region.bounds),
          region.timezoneOffsetHours,
          region.sealCharacter
        ]
      )
    );
  }
  console.log(`Imported ${regions.length} regions`);

  for (const poi of pois) {
    await withClient(async (client) => {
      await client.query(
        `INSERT INTO "Poi" (id, "regionId", name, "nameByLanguage", lat, lng, description, rating, categories, tags, seasons, "photoScore", "mustVisit", "bestTime", difficulty, "durationMinutes", importance, "visibilityMode")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO UPDATE SET "regionId" = $2, name = $3, "nameByLanguage" = $4, lat = $5, lng = $6, description = $7, rating = $8, categories = $9, tags = $10, seasons = $11, "photoScore" = $12, "mustVisit" = $13, "bestTime" = $14, difficulty = $15, "durationMinutes" = $16, importance = $17, "visibilityMode" = $18`,
        [
          poi.id,
          poi.regionId,
          poi.name,
          JSON.stringify(poi.nameByLanguage),
          poi.coordinates.lat,
          poi.coordinates.lng,
          poi.description,
          poi.rating,
          poi.categories,
          poi.tags,
          poi.seasons,
          poi.photoScore,
          poi.mustVisit,
          poi.bestTime,
          poi.difficulty,
          poi.durationMinutes,
          poi.importance,
          poi.visibilityMode
        ]
      );
    });

    await withClient((client) => client.query(`DELETE FROM "Photo" WHERE "poiId" = $1`, [poi.id]));

    for (const [index, photo] of poi.photos.entries()) {
      await withClient((client) =>
        client.query(
          `INSERT INTO "Photo" (id, "poiId", url, alt, author, season, position) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [photo.id, poi.id, photo.url, photo.alt, photo.author ?? null, photo.season ?? null, index]
        )
      );
    }

    console.log(`  - ${poi.id} (${poi.photos.length} photos)`);
  }
  console.log(`Imported ${pois.length} pois with photos`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
