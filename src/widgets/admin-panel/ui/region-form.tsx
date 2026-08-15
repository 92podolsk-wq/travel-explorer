"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { PublishStatus, Region, RegionInput } from "@/entities/region/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { translateFromRussian } from "@/shared/lib/admin-translate";
import { missingLanguages } from "@/shared/lib/translation-completeness";
import { useUnsavedChangesWarning } from "@/shared/lib/use-unsaved-changes-warning";
import { LocationMapPicker } from "./location-map-picker";

type FormState = {
  name: string;
  areaId: string;
  lat: string;
  lng: string;
  defaultZoom: string;
  swLng: string;
  swLat: string;
  neLng: string;
  neLat: string;
  timezoneOffsetHours: string;
  nameEn: string;
  nameRu: string;
  status: PublishStatus;
};

function toFormState(region: Region | undefined, defaultAreaId: string): FormState {
  if (!region) {
    return {
      name: "",
      areaId: defaultAreaId,
      lat: "",
      lng: "",
      defaultZoom: "12",
      swLng: "",
      swLat: "",
      neLng: "",
      neLat: "",
      timezoneOffsetHours: "9",
      nameEn: "",
      nameRu: "",
      status: "draft"
    };
  }

  return {
    name: region.name,
    areaId: region.areaId,
    lat: String(region.center.lat),
    lng: String(region.center.lng),
    defaultZoom: String(region.defaultZoom),
    swLng: String(region.bounds[0][0]),
    swLat: String(region.bounds[0][1]),
    neLng: String(region.bounds[1][0]),
    neLat: String(region.bounds[1][1]),
    timezoneOffsetHours: String(region.timezoneOffsetHours),
    nameEn: region.nameByLanguage.en,
    nameRu: region.nameByLanguage.ru,
    status: region.status
  };
}

function toRegionInput(form: FormState): RegionInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };
  if (!form.areaId) return { error: "Выберите регион/область." };

  const lat = Number(form.lat);
  const lng = Number(form.lng);
  const swLng = Number(form.swLng);
  const swLat = Number(form.swLat);
  const neLng = Number(form.neLng);
  const neLat = Number(form.neLat);
  const defaultZoom = Number(form.defaultZoom);
  const timezoneOffsetHours = Number(form.timezoneOffsetHours);

  if ([lat, lng, swLng, swLat, neLng, neLat, defaultZoom, timezoneOffsetHours].some((value) => Number.isNaN(value))) {
    return { error: "Координаты, масштаб, границы и часовой пояс должны быть числами." };
  }
  if (lat < -90 || lat > 90) return { error: "Широта центра должна быть от -90 до 90." };
  if (lng < -180 || lng > 180) return { error: "Долгота центра должна быть от -180 до 180." };
  if (swLat < -90 || swLat > 90 || neLat < -90 || neLat > 90) {
    return { error: "Широта границ должна быть от -90 до 90." };
  }
  if (swLng < -180 || swLng > 180 || neLng < -180 || neLng > 180) {
    return { error: "Долгота границ должна быть от -180 до 180." };
  }
  if (swLat >= neLat || swLng >= neLng) {
    return { error: "Юго-западный угол границ должен быть южнее и западнее северо-восточного." };
  }
  if (defaultZoom < 0 || defaultZoom > 22) return { error: "Масштаб по умолчанию должен быть от 0 до 22." };
  if (timezoneOffsetHours < -12 || timezoneOffsetHours > 14) {
    return { error: "Часовой пояс должен быть от -12 до 14." };
  }

  const name = form.name.trim();

  return {
    name,
    areaId: form.areaId,
    center: { lat, lng },
    defaultZoom,
    bounds: [
      [swLng, swLat],
      [neLng, neLat]
    ],
    timezoneOffsetHours,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: form.nameRu.trim() || name
    },
    status: form.status
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const selectClass =
  "h-11 w-full rounded-md border border-border bg-white/[0.78] px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-ring/25";

type RegionFormProps = {
  region?: Region;
  areas: Area[];
  onCancel: () => void;
  onSubmit: (input: RegionInput) => Promise<void> | void;
};

export function RegionForm({ region, areas, onCancel, onSubmit }: RegionFormProps) {
  const [initialForm] = useState<FormState>(() => toFormState(region, areas[0]?.id ?? ""));
  const [form, setForm] = useState<FormState>(initialForm);
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const missingName = missingLanguages([{ en: form.nameEn }]);

  const handleAutoTranslate = async () => {
    if (!form.nameRu.trim()) {
      setTranslateError("Сначала заполните название на русском.");
      return;
    }

    setTranslateError(null);
    setIsTranslating(true);
    try {
      const translations = await translateFromRussian([{ key: "name", text: form.nameRu.trim() }]);
      setForm((p) => ({
        ...p,
        nameEn: translations.name?.en ?? p.nameEn
      }));
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Не удалось перевести текст.");
    } finally {
      setIsTranslating(false);
    }
  };

  const submitForm = async (status: FormState["status"]) => {
    const result = toRegionInput({ ...form, status });

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit(result);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submitForm(form.status);
  };

  const handlePublish = async () => {
    setForm((p) => ({ ...p, status: "published" }));
    await submitForm("published");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Базовое название города — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже."
          >
            Название
          </label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tokyo" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Регион/область, к которой относится город — определяет группировку в меню выбора локации в шапке сайта."
          >
            Регион
          </label>
          <select
            className={selectClass}
            value={form.areaId}
            onChange={(e) => setForm((p) => ({ ...p, areaId: e.target.value }))}
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            className={cn(fieldLabel, "mb-0")}
            title="Название города на разных языках сайта — именно эти значения показываются в заголовке и в меню выбора локации в зависимости от выбранного языка интерфейса."
          >
            Названия по языкам
          </label>
          <Button type="button" variant="outline" onClick={handleAutoTranslate} disabled={isTranslating} className="h-7 shrink-0 gap-1.5 px-2 text-xs">
            <Languages className="h-3.5 w-3.5" />
            {isTranslating ? "Перевод…" : "Перевести с русского"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Токио" />
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Tokyo" />
        </div>
        {translateError && <p className="mt-1 text-xs font-medium text-red-600">{translateError}</p>}
        {missingName.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Похоже, не переведено: {missingName.map((lang) => lang.toUpperCase()).join(", ")}
          </p>
        )}
      </div>

      <div>
        <label className={fieldLabel} title="Найдите город на карте, чтобы точно указать координаты центра, вместо того чтобы вводить их вручную.">
          Центр города на карте
        </label>
        <LocationMapPicker
          lat={form.lat}
          lng={form.lng}
          onChange={(lat, lng) => setForm((p) => ({ ...p, lat: lat.toFixed(6), lng: lng.toFixed(6) }))}
          fallbackCenter={{ lat: 35.6762, lng: 139.6503 }}
          onCaptureBounds={(bounds) =>
            setForm((p) => ({
              ...p,
              swLat: bounds.swLat.toFixed(6),
              swLng: bounds.swLng.toFixed(6),
              neLat: bounds.neLat.toFixed(6),
              neLng: bounds.neLng.toFixed(6)
            }))
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Географический центр города — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого города."
          >
            Широта центра
          </label>
          <Input type="number" step="any" min="-90" max="90" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} placeholder="35.6762" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Географический центр города — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого города."
          >
            Долгота центра
          </label>
          <Input type="number" step="any" min="-180" max="180" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} placeholder="139.6503" />
        </div>
        <div>
          <label className={fieldLabel} title="Масштаб карты, который устанавливается по умолчанию при открытии этого города.">
            Масштаб по умолчанию
          </label>
          <Input type="number" step="1" min="0" max="22" value={form.defaultZoom} onChange={(e) => setForm((p) => ({ ...p, defaultZoom: e.target.value }))} />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Границы области, за пределы которых нельзя увести карту при просмотре этого города (юго-западный и северо-восточный углы). Можно не вводить вручную — используйте кнопку «Взять текущий вид карты как границы» над картой выбора центра."
        >
          Границы карты (юго-запад и северо-восток)
        </label>
        <div className="grid grid-cols-4 gap-3">
          <Input type="number" step="0.01" min="-180" max="180" value={form.swLng} onChange={(e) => setForm((p) => ({ ...p, swLng: e.target.value }))} placeholder="Долгота ЮЗ" />
          <Input type="number" step="0.01" min="-90" max="90" value={form.swLat} onChange={(e) => setForm((p) => ({ ...p, swLat: e.target.value }))} placeholder="Широта ЮЗ" />
          <Input type="number" step="0.01" min="-180" max="180" value={form.neLng} onChange={(e) => setForm((p) => ({ ...p, neLng: e.target.value }))} placeholder="Долгота СВ" />
          <Input type="number" step="0.01" min="-90" max="90" value={form.neLat} onChange={(e) => setForm((p) => ({ ...p, neLat: e.target.value }))} placeholder="Широта СВ" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Часовой пояс города (смещение от UTC в часах) — используется для расчёта местного времени, восхода/заката и прогноза погоды."
          >
            Часовой пояс (часы от UTC)
          </label>
          <Input type="number" step="1" min="-12" max="14" value={form.timezoneOffsetHours} onChange={(e) => setForm((p) => ({ ...p, timezoneOffsetHours: e.target.value }))} />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Черновик не показывается на сайте — виден только в админ-панели. Опубликуйте город, когда он будет готов."
        >
          Статус публикации
        </label>
        <select
          className={selectClass}
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "draft" | "published" }))}
        >
          <option value="draft">Черновик (скрыт на сайте)</option>
          <option value="published">Опубликован</option>
        </select>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        {form.status === "draft" && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePublish}
            disabled={isSaving}
            title="Сохранить и сразу опубликовать город на сайте."
          >
            {isSaving ? "Публикация…" : "Опубликовать"}
          </Button>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
