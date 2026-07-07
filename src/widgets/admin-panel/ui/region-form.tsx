"use client";

import { useState } from "react";
import type { Region, RegionInput } from "@/entities/region/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type FormState = {
  name: string;
  country: string;
  area: string;
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
};

function toFormState(region?: Region): FormState {
  if (!region) {
    return {
      name: "",
      country: "Japan",
      area: "",
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
      sealCharacter: ""
    };
  }

  return {
    name: region.name,
    country: region.country,
    area: region.area,
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
    sealCharacter: region.sealCharacter
  };
}

function toRegionInput(form: FormState): RegionInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };
  if (!form.country.trim()) return { error: "Укажите страну." };
  if (!form.area.trim()) return { error: "Укажите регион/область." };

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
    country: form.country.trim(),
    area: form.area.trim(),
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
    sealCharacter: form.sealCharacter.trim() || name.charAt(0)
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type RegionFormProps = {
  region?: Region;
  onCancel: () => void;
  onSubmit: (input: RegionInput) => Promise<void> | void;
};

export function RegionForm({ region, onCancel, onSubmit }: RegionFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(region));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Базовое название региона — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже."
          >
            Название
          </label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tokyo" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Страна — используется для группировки в выпадающем меню выбора локации (кнопка «Город, Область, Страна» в шапке сайта)."
          >
            Страна
          </label>
          <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} placeholder="Japan" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Область/регион страны (например, Kansai) — средний уровень группировки в том же меню выбора локации в шапке сайта."
          >
            Область
          </label>
          <Input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} placeholder="Kansai" />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Название региона на разных языках сайта — именно эти значения показываются в заголовке и в меню выбора локации в зависимости от выбранного языка интерфейса."
        >
          Названия по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Tokyo" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Токио" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA — 東京" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            className={fieldLabel}
            title="Географический центр региона — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого региона."
          >
            Широта центра
          </label>
          <Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))} placeholder="35.6762" />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Географический центр региона — используется для расчёта времени восхода/заката, прогноза погоды и как точка, куда карта перемещается при выборе этого региона."
          >
            Долгота центра
          </label>
          <Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))} placeholder="139.6503" />
        </div>
        <div>
          <label className={fieldLabel} title="Масштаб карты, который устанавливается по умолчанию при открытии этого региона.">
            Масштаб по умолчанию
          </label>
          <Input type="number" step="1" value={form.defaultZoom} onChange={(e) => setForm((p) => ({ ...p, defaultZoom: e.target.value }))} />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Границы области, за пределы которых нельзя увести карту при просмотре этого региона (юго-западный и северо-восточный углы)."
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
            title="Часовой пояс региона (смещение от UTC в часах) — используется для расчёта местного времени, восхода/заката и прогноза погоды."
          >
            Часовой пояс (часы от UTC)
          </label>
          <Input type="number" step="1" value={form.timezoneOffsetHours} onChange={(e) => setForm((p) => ({ ...p, timezoneOffsetHours: e.target.value }))} />
        </div>
        <div>
          <label
            className={fieldLabel}
            title="Иероглиф на красной печати (ханко), которая показывается рядом с названием региона в боковой панели."
          >
            Символ печати
          </label>
          <Input value={form.sealCharacter} onChange={(e) => setForm((p) => ({ ...p, sealCharacter: e.target.value }))} placeholder="東" />
        </div>
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
