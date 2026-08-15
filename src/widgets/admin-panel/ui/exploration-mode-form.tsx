"use client";

import { useState } from "react";
import { poiTags } from "@/entities/poi/model/constants";
import type { PoiTag } from "@/entities/poi/model/types";
import type { ExplorationMode, ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import { modeIconOptions } from "@/features/exploration-mode/ui/mode-icon";
import { getTranslations } from "@/shared/i18n/translations";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { useUnsavedChangesWarning } from "@/shared/lib/use-unsaved-changes-warning";

const t = getTranslations("ru");

type FormState = {
  name: string;
  nameEn: string;
  nameRu: string;
  description: string;
  descriptionEn: string;
  descriptionRu: string;
  tags: PoiTag[];
  icon: string;
};

function toFormState(mode: ExplorationMode | undefined): FormState {
  if (!mode) {
    return {
      name: "",
      nameEn: "",
      nameRu: "",
      description: "",
      descriptionEn: "",
      descriptionRu: "",
      tags: [],
      icon: modeIconOptions[0].key
    };
  }

  return {
    name: mode.name,
    nameEn: mode.nameByLanguage.en,
    nameRu: mode.nameByLanguage.ru,
    description: mode.description,
    descriptionEn: mode.descriptionByLanguage.en,
    descriptionRu: mode.descriptionByLanguage.ru,
    tags: mode.tags,
    icon: mode.icon
  };
}

function toModeInput(form: FormState): ExplorationModeInput | { error: string } {
  if (!form.name.trim()) return { error: "Укажите название." };
  if (form.tags.length === 0) return { error: "Выберите хотя бы один тег." };

  const name = form.name.trim();
  const description = form.description.trim();

  return {
    name,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: form.nameRu.trim() || name
    },
    description,
    descriptionByLanguage: {
      en: form.descriptionEn.trim() || description,
      ru: form.descriptionRu.trim() || description
    },
    tags: form.tags,
    icon: form.icon
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const chipClass = (active: boolean) =>
  cn(
    "cursor-pointer select-none rounded-md border px-2.5 py-1 text-xs font-medium transition",
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-muted-foreground hover:bg-muted"
  );

type ExplorationModeFormProps = {
  mode?: ExplorationMode;
  onCancel: () => void;
  onSubmit: (input: ExplorationModeInput) => Promise<void> | void;
};

export function ExplorationModeForm({ mode, onCancel, onSubmit }: ExplorationModeFormProps) {
  const [initialForm] = useState<FormState>(() => toFormState(mode));
  const [form, setForm] = useState<FormState>(initialForm);
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: PoiTag) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((item) => item !== tag) : [...prev.tags, tag]
    }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toModeInput(form);

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
          title="Базовое название режима — используется как запасной вариант, если для какого-то языка не задано отдельное название ниже."
        >
          Название
        </label>
        <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Photographer" />
      </div>

      <div>
        <label className={fieldLabel} title="Название режима на разных языках сайта — показывается на кнопке-фильтре в боковой панели.">
          Названия по языкам
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU — Фотограф" />
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN — Photographer" />
        </div>
      </div>

      <div>
        <label className={fieldLabel} title="Базовое описание — запасной вариант, если для какого-то языка не задано отдельное описание ниже.">
          Описание
        </label>
        <Input
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Photo score, light, viewpoints, and atmosphere."
        />
      </div>

      <div>
        <label className={fieldLabel} title="Описание режима на разных языках — показывается всплывающей подсказкой при наведении на кнопку-фильтр.">
          Описания по языкам
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={form.descriptionRu}
            onChange={(e) => setForm((p) => ({ ...p, descriptionRu: e.target.value }))}
            placeholder="RU"
          />
          <Input
            value={form.descriptionEn}
            onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
            placeholder="EN"
          />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title="Места попадают в этот режим, если у них есть хотя бы один из выбранных тегов. Теги задаются в карточке локации на вкладке «Локации»."
        >
          Теги
        </label>
        <div className="flex flex-wrap gap-2">
          {poiTags.map((tag) => (
            <button key={tag} type="button" className={chipClass(form.tags.includes(tag))} onClick={() => toggleTag(tag)}>
              {t.tag[tag]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={fieldLabel} title="Иконка, которая показывается на кнопке-фильтре рядом с названием режима.">
          Иконка
        </label>
        <div className="flex flex-wrap gap-2">
          {modeIconOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.key}
                type="button"
                title={option.label}
                onClick={() => setForm((p) => ({ ...p, icon: option.key }))}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border transition",
                  form.icon === option.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-white text-muted-foreground hover:bg-muted"
                )}
              >
                <OptionIcon className="h-4 w-4" />
              </button>
            );
          })}
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
