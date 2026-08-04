"use client";

import { useRef, useState } from "react";
import type { Area, AreaInput } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useUnsavedChangesWarning } from "@/shared/lib/use-unsaved-changes-warning";

type FormState = {
  countryId: string;
  name: string;
  nameEn: string;
  nameRu: string;
  nameJa: string;
};

function toFormState(area: Area | undefined, defaultCountryId: string): FormState {
  if (!area) {
    return { countryId: defaultCountryId, name: "", nameEn: "", nameRu: "", nameJa: "" };
  }

  return {
    countryId: area.countryId,
    name: area.name,
    nameEn: area.nameByLanguage.en,
    nameRu: area.nameByLanguage.ru,
    nameJa: area.nameByLanguage.ja
  };
}

function toAreaInput(form: FormState): AreaInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };
  if (!form.countryId) return { error: "Выберите страну." };

  const name = form.name.trim();

  return {
    countryId: form.countryId,
    name,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: form.nameRu.trim() || name,
      ja: form.nameJa.trim() || name
    }
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const selectClass =
  "h-11 w-full rounded-md border border-border bg-white/[0.78] px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-ring/25";

type AreaFormProps = {
  area?: Area;
  countries: Country[];
  onCancel: () => void;
  onSubmit: (input: AreaInput) => Promise<void> | void;
};

export function AreaForm({ area, countries, onCancel, onSubmit }: AreaFormProps) {
  const initialFormRef = useRef<FormState>(toFormState(area, countries[0]?.id ?? ""));
  const [form, setForm] = useState<FormState>(() => initialFormRef.current);
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toAreaInput(form);

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
      <div>
        <label className={fieldLabel} title="Страна, к которой относится этот регион/область.">
          Страна
        </label>
        <select
          className={selectClass}
          value={form.countryId}
          onChange={(e) => setForm((p) => ({ ...p, countryId: e.target.value }))}
        >
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Базовое название региона — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже."
        >
          Название
        </label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Kansai" />
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Название региона на разных языках сайта — показывается в меню выбора локации в шапке в зависимости от выбранного языка интерфейса."
        >
          Названия по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Kansai" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Кансай" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA — 関西" />
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
