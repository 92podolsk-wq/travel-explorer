"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { Difficulty, PoiInput, PoiMainCategory, PoiTag } from "@/entities/poi/model/types";
import { parseCsv, rowsToObjects } from "@/shared/lib/csv";
import { Button } from "@/shared/ui/button";

type ImportResult = { created: number; errors: Array<{ index: number; name: string; error: string }> };

function splitSubList(value: string): string[] {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvRowToPoiInput(row: Record<string, string>): PoiInput {
  const name = row.name?.trim() ?? "";
  return {
    regionId: row.regionId?.trim() ?? "",
    name,
    nameByLanguage: {
      en: row.nameEn?.trim() || name,
      ru: row.nameRu?.trim() || name,
      ja: row.nameJa?.trim() || name
    },
    description: row.description?.trim() ?? "",
    descriptionByLanguage: {
      en: row.description?.trim() ?? "",
      ru: row.description?.trim() ?? "",
      ja: row.description?.trim() ?? ""
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
    mustVisit: row.mustVisit?.trim().toLowerCase() === "true",
    bestTime: splitSubList(row.bestTime ?? ""),
    bestTimeByLanguage: {
      en: splitSubList(row.bestTime ?? ""),
      ru: splitSubList(row.bestTime ?? ""),
      ja: splitSubList(row.bestTime ?? "")
    },
    difficulty: (row.difficulty?.trim() as Difficulty) || "easy",
    durationMinutes: Number(row.durationMinutes) || 60,
    importance: Number(row.importance) || 70,
    status: row.status?.trim() === "published" ? "published" : "draft"
  };
}

const csvTemplate =
  "regionId,name,nameEn,nameRu,nameJa,description,lat,lng,rating,category,tags,seasons,photoScore,mustVisit,bestTime,difficulty,durationMinutes,importance,status,photoUrl,photoAlt\n" +
  'kyoto,Example Place,Example Place,Пример места,例の場所,"A short description, with commas if needed.",35.01,135.76,4.6,temples,"photographer;nature","all year",80,false,"Morning;Late afternoon",easy,60,70,draft,https://example.com/photo.jpg,Example photo\n';

type ImportExportPanelProps = {
  onImported: () => void;
};

export function ImportExportPanel({ onImported }: ImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
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

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    setIsImporting(true);

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
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Не удалось выполнить импорт.");
        return;
      }

      const data = (await res.json()) as ImportResult;
      setResult(data);
      if (data.created > 0) onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось разобрать файл.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-3 shadow-sm">
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
        <Download className="h-3.5 w-3.5" />
        Экспортировать всё (JSON)
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate}>
        Шаблон CSV
      </Button>
      <label className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/5 cursor-pointer">
        <Upload className="h-3.5 w-3.5" />
        {isImporting ? "Импорт…" : "Импортировать локации (CSV/JSON)"}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          className="hidden"
          disabled={isImporting}
          onChange={handleFileSelected}
        />
      </label>
      {error && <p className="w-full text-sm font-medium text-red-600">{error}</p>}
      {result && (
        <p className="w-full text-sm text-muted-foreground">
          Добавлено: {result.created}
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
