"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { MapStyleId, SiteSettings } from "@/entities/site-setting/model/types";
import { mapStyleOptions } from "@/shared/map/map-styles";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";

export function SiteSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<MapStyleId>("openfreemap-bright");
  const [pmtilesUrl, setPmtilesUrl] = useState("");
  const [maxCustomMarkers, setMaxCustomMarkers] = useState("200");
  const [maxPhotoUploadsPerUser, setMaxPhotoUploadsPerUser] = useState("5");
  const [maxPhotoUploadsSiteWide, setMaxPhotoUploadsSiteWide] = useState("200");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/site-settings");
      if (!res.ok) {
        setLoadError("Не удалось загрузить настройки.");
        return;
      }
      const data = (await res.json()) as SiteSettings;
      setSettings(data);
      setSelectedStyle(data.mapStyleId);
      setPmtilesUrl(data.protomapsPmtilesUrl ?? "");
      setMaxCustomMarkers(String(data.maxCustomMarkersPerUser));
      setMaxPhotoUploadsPerUser(String(data.maxPhotoUploadsPerUserPerDay));
      setMaxPhotoUploadsSiteWide(String(data.maxPhotoUploadsSiteWidePerDay));
    })();
  }, []);

  async function handleSave() {
    setSaveError(null);
    setIsSaved(false);

    const parsedLimit = Number(maxCustomMarkers);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 0 || parsedLimit > 5000) {
      setSaveError("Лимит меток должен быть целым числом от 0 до 5000.");
      return;
    }

    const parsedPhotoUserLimit = Number(maxPhotoUploadsPerUser);
    if (!Number.isInteger(parsedPhotoUserLimit) || parsedPhotoUserLimit < 0 || parsedPhotoUserLimit > 100) {
      setSaveError("Лимит фото на пользователя в сутки должен быть целым числом от 0 до 100.");
      return;
    }

    const parsedPhotoSiteLimit = Number(maxPhotoUploadsSiteWide);
    if (!Number.isInteger(parsedPhotoSiteLimit) || parsedPhotoSiteLimit < 0 || parsedPhotoSiteLimit > 10000) {
      setSaveError("Общий лимит фото в сутки должен быть целым числом от 0 до 10000.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapStyleId: selectedStyle,
          protomapsPmtilesUrl: pmtilesUrl,
          maxCustomMarkersPerUser: parsedLimit,
          maxPhotoUploadsPerUserPerDay: parsedPhotoUserLimit,
          maxPhotoUploadsSiteWidePerDay: parsedPhotoSiteLimit
        })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setSaveError(data?.error ?? "Не удалось сохранить настройки.");
        return;
      }

      const updated = (await res.json()) as SiteSettings;
      setSettings(updated);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) {
    return <p className="text-sm font-medium text-red-600">{loadError}</p>;
  }

  if (!settings) {
    return <p className="text-sm text-muted-foreground">Загрузка…</p>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Стиль карты</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Выберите подложку, которая будет использоваться на карте сайта для всех посетителей.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {mapStyleOptions.map((option) => {
          const isSelected = selectedStyle === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedStyle(option.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition",
                isSelected ? "border-primary bg-primary/5" : "border-border bg-white hover:border-primary/40"
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{option.name}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </button>
          );
        })}
      </div>

      {selectedStyle === "protomaps" && (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/40 p-3">
          <label className="text-xs font-semibold text-foreground" htmlFor="protomaps-pmtiles-url">
            URL PMTiles-файла
          </label>
          <Input
            id="protomaps-pmtiles-url"
            value={pmtilesUrl}
            onChange={(e) => setPmtilesUrl(e.target.value)}
            placeholder="https://example.com/basemap.pmtiles"
          />
          <p className="text-xs text-muted-foreground">
            Protomaps раздаёт готовые сборки на maps.protomaps.com/builds, но напрямую ссылаться на них не
            рекомендуется — скопируйте файл в своё хранилище (S3, R2 и т.п.) и укажите его URL здесь.
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground">Пользовательские метки</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Сколько собственных меток на карте может создать один пользователь.
        </p>
      </div>

      <div className="max-w-xs space-y-1.5">
        <label className="text-xs font-semibold text-foreground" htmlFor="max-custom-markers">
          Лимит меток на пользователя
        </label>
        <Input
          id="max-custom-markers"
          type="number"
          min={0}
          max={5000}
          value={maxCustomMarkers}
          onChange={(e) => setMaxCustomMarkers(e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground">Загрузка фото пользователями</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Дневные лимиты на загрузку фото к локациям — защита от спама. Загруженные фото попадают на модерацию.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="max-w-xs space-y-1.5">
          <label className="text-xs font-semibold text-foreground" htmlFor="max-photo-uploads-per-user">
            Лимит фото на пользователя в сутки
          </label>
          <Input
            id="max-photo-uploads-per-user"
            type="number"
            min={0}
            max={100}
            value={maxPhotoUploadsPerUser}
            onChange={(e) => setMaxPhotoUploadsPerUser(e.target.value)}
          />
        </div>

        <div className="max-w-xs space-y-1.5">
          <label className="text-xs font-semibold text-foreground" htmlFor="max-photo-uploads-site-wide">
            Общий лимит фото в сутки
          </label>
          <Input
            id="max-photo-uploads-site-wide"
            type="number"
            min={0}
            max={10000}
            value={maxPhotoUploadsSiteWide}
            onChange={(e) => setMaxPhotoUploadsSiteWide(e.target.value)}
          />
        </div>
      </div>

      {saveError && <p className="text-sm font-medium text-red-600">{saveError}</p>}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          Сохранить
        </Button>
        {isSaved && <span className="text-xs font-medium text-emerald-600">Сохранено</span>}
      </div>
    </div>
  );
}
