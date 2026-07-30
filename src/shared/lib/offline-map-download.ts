export type OfflineDownloadProgress = { loaded: number; total: number };

type StyleSource = { type?: string; tiles?: string[]; url?: string };
type StyleJson = { sources?: Record<string, StyleSource> };
type TileJson = { tiles?: string[]; maxzoom?: number };

function lonLatToTile(lon: number, lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

async function resolveTileTemplates(styleUrl: string): Promise<{ templates: string[]; maxzoom: number | null }> {
  const style = (await (await fetch(styleUrl)).json()) as StyleJson;
  const templates: string[] = [];
  let maxzoom: number | null = null;

  for (const source of Object.values(style.sources ?? {})) {
    if (source.tiles?.[0]) {
      templates.push(source.tiles[0]);
      continue;
    }
    if (source.url) {
      try {
        const tileJson = (await (await fetch(source.url)).json()) as TileJson;
        if (tileJson.tiles?.[0]) {
          templates.push(tileJson.tiles[0]);
          if (typeof tileJson.maxzoom === "number") {
            maxzoom = maxzoom === null ? tileJson.maxzoom : Math.min(maxzoom, tileJson.maxzoom);
          }
        }
      } catch {
        // skip sources whose TileJSON couldn't be resolved
      }
    }
  }

  return { templates, maxzoom };
}

export type DownloadRegionOptions = {
  bounds: [[number, number], [number, number]];
  minZoom: number;
  maxZoom: number;
  styleUrl: string;
  onProgress?: (progress: OfflineDownloadProgress) => void;
  signal?: AbortSignal;
};

export async function downloadRegionForOffline({
  bounds,
  minZoom,
  maxZoom,
  styleUrl,
  onProgress,
  signal
}: DownloadRegionOptions): Promise<void> {
  const { templates, maxzoom: discoveredMaxZoom } = await resolveTileTemplates(styleUrl);

  if (templates.length === 0) {
    throw new Error("No tile sources found for this map style");
  }

  const effectiveMaxZoom = discoveredMaxZoom === null ? maxZoom : Math.min(maxZoom, discoveredMaxZoom);
  const [[swLng, swLat], [neLng, neLat]] = bounds;

  const tileUrls: string[] = [];
  for (let z = minZoom; z <= effectiveMaxZoom; z++) {
    const nw = lonLatToTile(swLng, neLat, z);
    const se = lonLatToTile(neLng, swLat, z);
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        for (const template of templates) {
          tileUrls.push(template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)));
        }
      }
    }
  }

  let loaded = 0;
  const total = tileUrls.length;
  onProgress?.({ loaded, total });

  const CONCURRENCY = 6;
  let cursor = 0;

  async function worker() {
    while (cursor < tileUrls.length) {
      if (signal?.aborted) return;
      const url = tileUrls[cursor++];
      try {
        await fetch(url, { signal });
      } catch {
        // ignore individual tile failures, keep going
      }
      loaded++;
      onProgress?.({ loaded, total });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}
