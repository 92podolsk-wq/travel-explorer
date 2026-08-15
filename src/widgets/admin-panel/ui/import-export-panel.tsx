"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { Difficulty, Poi, PoiInput, PoiMainCategory, PoiTag } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { parseCsv, rowsToObjects, toCsv } from "@/shared/lib/csv";
import { Button } from "@/shared/ui/button";

type DryRunResult = { toCreate: number; toUpdate: number; errors: Array<{ index: number; name: string; error: string }> };
type CommitResult = { created: number; updated: number; errors: Array<{ index: number; name: string; error: string }> };

function splitSubList(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvRowToPoiInput(row: Record<string, string>): PoiInput {
  const name = row.name?.trim() ?? "";
  return {
    id: row.id?.trim() || undefined,
    regionId: row.regionId?.trim() ?? "",
    name,
    nameByLanguage: {
      en: row.nameEn?.trim() || name,
      ru: row.nameRu?.trim() || name
    },
    description: row.description?.trim() ?? "",
    descriptionByLanguage: {
      en: row.description?.trim() ?? "",
      ru: row.description?.trim() ?? ""
    },
    coordinates: { lat: Number(row.lat), lng: Number(row.lng) },
    rating: Number(row.rating) || 4.5,
    photos: row.photoUrl?.trim()
      ? [{ id: `${row.photoUrl}-import`.slice(0, 60), url: row.photoUrl.trim(), alt: row.photoAlt?.trim() || name }]
      : [],
    category: (row.category?.trim() as PoiMainCategory) || "unique",
    tags: splitSubList(row.tags ?? "") as PoiTag[],
    seasons: splitSubList(row.seasons ?? ""),
    photoScore: Number(row.photoScore) || 70,
    difficulty: (row.difficulty?.trim() as Difficulty) || "easy",
    durationMinutes: Number(row.durationMinutes) || 60,
    importance: Number(row.importance) || 70,
    status: row.status?.trim() === "published" ? "published" : "draft"
  };
}

const csvColumns = [
  "id",
  "regionId",
  "name",
  "nameEn",
  "nameRu",
  "description",
  "lat",
  "lng",
  "rating",
  "category",
  "tags",
  "seasons",
  "photoScore",
  "difficulty",
  "durationMinutes",
  "importance",
  "status",
  "photoUrl",
  "photoAlt"
];

function poiToCsvRow(poi: Poi): string[] {
  return [
    poi.id,
    poi.regionId,
    poi.name,
    poi.nameByLanguage.en,
    poi.nameByLanguage.ru,
    poi.description,
    String(poi.coordinates.lat),
    String(poi.coordinates.lng),
    String(poi.rating),
    poi.category,
    poi.tags.join(";"),
    poi.seasons.join(";"),
    String(poi.photoScore),
    poi.difficulty,
    String(poi.durationMinutes),
    String(poi.importance),
    poi.status,
    poi.photos[0]?.url ?? "",
    poi.photos[0]?.alt ?? ""
  ];
}

const csvTemplate = toCsv(csvColumns, [
  [
    "",
    "kyoto",
    "Example Place",
    "Example Place",
    "Пример места",
    "A short description, with commas if needed.",
    "35.01",
    "135.76",
    "4.6",
    "temples",
    "photographer;nature",
    "all year",
    "80",
    "easy",
    "60",
    "70",
    "draft",
    "https://example.com/photo.jpg",
    "Example photo"
  ]
]);

type ImportExportPanelProps = {
  pois: Poi[];
  regions: Region[];
  cityFilter: string;
  onImported: () => void;
};

export function ImportExportPanel({ pois, regions, cityFilter, onImported }: ImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [pendingItems, setPendingItems] = useState<PoiInput[] | null>(null);
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    window.location.href = "/api/admin/export";
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pois-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const scopedPois = cityFilter === "all" ? pois : pois.filter((poi) => poi.regionId === cityFilter);
    const csv = toCsv(csvColumns, scopedPois.map(poiToCsvRow));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cityName = cityFilter === "all" ? "all-cities" : (regions.find((region) => region.id === cityFilter)?.id ?? cityFilter);
    link.download = `pois-${cityName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    setPendingItems(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetState();
    setIsChecking(true);

    try {
      const text = await file.text();
      let items: PoiInput[];

      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text) as PoiInput[];
        if (!Array.isArray(parsed)) throw new Error("JSON должен содержать массив локаций.");
        items = parsed;
      } else {
        const rows = rowsToObjects(parseCsv(text));
        items = rows.map(csvRowToPoiInput);
      }

      const res = await fetch("/api/admin/import/pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, dryRun: true })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Не удалось проверить файл.");
        return;
      }

      const data = (await res.json()) as DryRunResult;
      setPendingItems(items);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось разобрать файл.");
    } finally {
      setIsChecking(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingItems) return;

    setIsCommitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/import/pois", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: pendingItems, dryRun: false })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Не удалось выполнить импорт.");
        return;
      }

      const data = (await res.json()) as CommitResult;
      setResult(data);
      setPendingItems(null);
      setPreview(null);
      if (data.created > 0 || data.updated > 0) onImported();
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-3 shadow-sm">
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        Экспортировать всё (JSON)
      </Button>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExportCsv}>
        <Download className="h-3.5 w-3.5" />
        {cityFilter === "all" ? "Экспортировать CSV (все локации)" : "Экспортировать CSV (этот город)"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
        Шаблон CSV
      </Button>
      <label className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/5 cursor-pointer">
        <Upload className="h-3.5 w-3.5" />
        {isChecking ? "Проверка…" : "Импортировать локации (CSV/JSON)"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          disabled={isChecking || Boolean(pendingItems)}
          onChange={handleFileSelected}
        />
      </label>
      {error && <p className="w-full text-sm font-medium text-red-600">{error}</p>}
      {preview && pendingItems && (
        <div className="w-full rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">
            Будет создано: {preview.toCreate} · Будет обновлено: {preview.toUpdate}
            {preview.errors.length > 0 && <> · Ошибок: {preview.errors.length}</>}
          </p>
          {preview.errors.length > 0 && (
            <ul className="mt-1.5 list-inside list-disc text-xs text-red-600">
              {preview.errors.slice(0, 5).map((e) => (
                <li key={e.index}>
                  {e.name || `#${e.index + 1}`}: {e.error}
                </li>
              ))}
              {preview.errors.length > 5 && <li>…и ещё {preview.errors.length - 5}</li>}
            </ul>
          )}
          <div className="mt-2.5 flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isCommitting || preview.toCreate + preview.toUpdate === 0}
              onClick={handleConfirmImport}
            >
              {isCommitting ? "Импорт…" : "Подтвердить импорт"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isCommitting} onClick={resetState}>
              Отмена
            </Button>
          </div>
        </div>
      )}
      {result && (
        <p className="w-full text-sm text-muted-foreground">
          Создано: {result.created} · Обновлено: {result.updated}
          {result.errors.length > 0 && (
            <>
              {" "}
              · Ошибок: {result.errors.length} (
              {result.errors
                .slice(0, 3)
                .map((e) => `${e.name || `#${e.index + 1}`}: ${e.error}`)
                .join("; ")}
              {result.errors.length > 3 ? "…" : ""})
            </>
          )}
        </p>
      )}
    </div>
  );
}
