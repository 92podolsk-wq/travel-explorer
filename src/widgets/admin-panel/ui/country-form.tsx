"use client";

import { useRef, useState } from "react";
import type { Country, CountryInput } from "@/entities/country/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useUnsavedChangesWarning } from "@/shared/lib/use-unsaved-changes-warning";

type FormState = {
  name: string;
  nameEn: string;
  nameRu: string;
  nameJa: string;
};

function toFormState(country?: Country): FormState {
  if (!country) {
    return { name: "", nameEn: "", nameRu: "", nameJa: "" };
  }

  return {
    name: country.name,
    nameEn: country.nameByLanguage.en,
    nameRu: country.nameByLanguage.ru,
    nameJa: country.nameByLanguage.ja
  };
}

function toCountryInput(form: FormState): CountryInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };

  const name = form.name.trim();

  return {
    name,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: form.nameRu.trim() || name,
      ja: form.nameJa.trim() || name
    }
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type CountryFormProps = {
  country?: Country;
  onCancel: () => void;
  onSubmit: (input: CountryInput) => Promise<void> | void;
};

export function CountryForm({ country, onCancel, onSubmit }: CountryFormProps) {
  const initialFormRef = useRef<FormState>(toFormState(country));
  const [form, setForm] = useState<FormState>(() => initialFormRef.current);
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialFormRef.current));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toCountryInput(form);

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
        <label
          className={fieldLabel}
          title="Базовое название страны — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже."
        >
          Название
        </label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Japan" />
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Название страны на разных языках сайта — показывается в меню выбора локации в шапке в зависимости от выбранного языка интерфейса."
        >
          Названия по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Japan" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Япония" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA — 日本" />
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
