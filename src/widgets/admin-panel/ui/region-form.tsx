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
  nameJa: string;
  sealCharacter: string;
  status: PublishStatus;
  sakuraStart: string;
  sakuraEnd: string;
  autumnStart: string;
  autumnEnd: string;
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
      nameJa: "",
      sealCharacter: "",
      status: "draft",
      sakuraStart: "",
      sakuraEnd: "",
      autumnStart: "",
      autumnEnd: ""
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
    nameJa: region.nameByLanguage.ja,
    sealCharacter: region.sealCharacter,
    status: region.status,
    sakuraStart: region.seasonWindows.spring?.start ?? "",
    sakuraEnd: region.seasonWindows.spring?.end ?? "",
    autumnStart: region.seasonWindows.autumn?.start ?? "",
    autumnEnd: region.seasonWindows.autumn?.end ?? ""
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
      ru: form.nameRu.trim() || name,
      ja: form.nameJa.trim() || name
    },
    sealCharacter: form.sealCharacter.trim() || name.charAt(0),
    status: form.status,
    seasonWindows: {
      ...(form.sakuraStart.trim() && form.sakuraEnd.trim()
        ? { spring: { start: form.sakuraStart.trim(), end: form.sakuraEnd.trim() } }
        : {}),
      ...(form.autumnStart.trim() && form.autumnEnd.trim()
        ? { autumn: { start: form.autumnStart.trim(), end: form.autumnEnd.trim() } }
        : {})
    }
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
  const [form, setForm] = useState<FormState>(() => toFormState(region, areas[0]?.id ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const missingName = missingLanguages([{ en: form.nameEn, ja: form.nameJa }]);

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
        nameEn: translations.name?.en ?? p.nameEn,
        nameJa: translations.name?.ja ?? p.nameJa
      }));
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Не удалось перевести текст.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toRegionInput(form);

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
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Tokyo" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Токио" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA — 東京" />
        </div>
        {translateError && <p className="mt-1 text-xs font-medium text-red-600">{translateError}</p>}
        {missingName.length > 0 && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Похоже, не переведено: {missingName.map((lang) => lang.toUpperCase()).join(", ")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Географический центр города — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого города."
          >
            Широта центра
          </label>
          <Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} placeholder="35.6762" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Географический центр города — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого города."
          >
            Долгота центра
          </label>
          <Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} placeholder="139.6503" />
        </div>
        <div>
          <label className={fieldLabel} title="Масштаб карты, который устанавливается по умолчанию при открытии этого города.">
            Масштаб по умолчанию
          </label>
          <Input type="number" step="1" value={form.defaultZoom} onChange={(e) => setForm((p) => ({ ...p, defaultZoom: e.target.value }))} />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Границы области, за пределы которых нельзя увести карту при просмотре этого города (юго-западный и северо-восточный углы)."
        >
          Границы карты (юго-запад и северо-восток)
        </label>
        <div className="grid grid-cols-4 gap-3">
          <Input type="number" step="0.01" value={form.swLng} onChange={(e) => setForm((p) => ({ ...p, swLng: e.target.value }))} placeholder="Долгота ЮЗ" />
          <Input type="number" step="0.01" value={form.swLat} onChange={(e) => setForm((p) => ({ ...p, swLat: e.target.value }))} placeholder="Широта ЮЗ" />
          <Input type="number" step="0.01" value={form.neLng} onChange={(e) => setForm((p) => ({ ...p, neLng: e.target.value }))} placeholder="Долгота СВ" />
          <Input type="number" step="0.01" value={form.neLat} onChange={(e) => setForm((p) => ({ ...p, neLat: e.target.value }))} placeholder="Широта СВ" />
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
          <Input type="number" step="1" value={form.timezoneOffsetHours} onChange={(e) => setForm((p) => ({ ...p, timezoneOffsetHours: e.target.value }))} />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Иероглиф на красной печати (ханко), которая показывается рядом с названием города в боковой панели."
          >
            Символ печати
          </label>
          <Input value={form.sealCharacter} onChange={(e) => setForm((p) => ({ ...p, sealCharacter: e.target.value }))} placeholder="東" />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Даты сезона цветения сакуры (день-месяц, например 25-03). За неделю до начала на сайте показывается напоминание пользователям, которые сейчас смотрят этот город. Оставьте пустым, чтобы не показывать."
        >
          Сезон сакуры (день-месяц)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input value={form.sakuraStart} onChange={(e) => setForm((p) => ({ ...p, sakuraStart: e.target.value }))} placeholder="Начало, 03-25" />
          <Input value={form.sakuraEnd} onChange={(e) => setForm((p) => ({ ...p, sakuraEnd: e.target.value }))} placeholder="Конец, 04-08" />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Даты сезона осенних красок (день-месяц). За неделю до начала на сайте показывается напоминание пользователям, которые сейчас смотрят этот город. Оставьте пустым, чтобы не показывать."
        >
          Сезон осенних красок (день-месяц)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input value={form.autumnStart} onChange={(e) => setForm((p) => ({ ...p, autumnStart: e.target.value }))} placeholder="Начало, 11-15" />
          <Input value={form.autumnEnd} onChange={(e) => setForm((p) => ({ ...p, autumnEnd: e.target.value }))} placeholder="Конец, 11-30" />
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
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
