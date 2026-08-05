"use client";

import { useState } from "react";
import type { Category, CategoryInput } from "@/entities/category/model/types";
import { categoryColorOptions, categoryIconOptions, defaultCategoryColor } from "@/entities/category/ui/category-icon-options";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import { useUnsavedChangesWarning } from "@/shared/lib/use-unsaved-changes-warning";

type FormState = {
  nameEn: string;
  nameRu: string;
  nameJa: string;
  icon: string;
  color: string;
  isHidden: boolean;
};

function toFormState(category: Category | undefined): FormState {
  if (!category) {
    return {
      nameEn: "",
      nameRu: "",
      nameJa: "",
      icon: categoryIconOptions[0].key,
      color: defaultCategoryColor,
      isHidden: false
    };
  }

  return {
    nameEn: category.nameByLanguage.en,
    nameRu: category.nameByLanguage.ru,
    nameJa: category.nameByLanguage.ja,
    icon: category.icon,
    color: category.color,
    isHidden: category.isHidden
  };
}

function toCategoryInput(form: FormState): CategoryInput | { error: string } {
  if (!form.nameRu.trim()) return { error: "Укажите название на русском." };

  const name = form.nameRu.trim();

  return {
    name,
    nameByLanguage: {
      en: form.nameEn.trim() || name,
      ru: name,
      ja: form.nameJa.trim() || name
    },
    icon: form.icon,
    color: form.color,
    isHidden: form.isHidden
  };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type CategoryFormProps = {
  category?: Category;
  onCancel: () => void;
  onSubmit: (input: CategoryInput) => Promise<void> | void;
};

export function CategoryForm({ category, onCancel, onSubmit }: CategoryFormProps) {
  const [initialForm] = useState<FormState>(() => toFormState(category));
  const [form, setForm] = useState<FormState>(initialForm);
  useUnsavedChangesWarning(JSON.stringify(form) !== JSON.stringify(initialForm));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = toCategoryInput(form);

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
        <label className={fieldLabel} title="Названия категории на разных языках сайта — показывается в фильтре и на бейдже места.">
          Названия по языкам
        </label>
        <div className="grid grid-cols-3 gap-3">
          <Input value={form.nameEn} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} placeholder="EN" />
          <Input value={form.nameRu} onChange={(e) => setForm((p) => ({ ...p, nameRu: e.target.value }))} placeholder="RU" />
          <Input value={form.nameJa} onChange={(e) => setForm((p) => ({ ...p, nameJa: e.target.value }))} placeholder="JA" />
        </div>
      </div>

      <div>
        <label className={fieldLabel} title="Иконка, которая показывается на маркере карты, в фильтре и на бейдже места.">
          Иконка
        </label>
        <div className="flex flex-wrap gap-2">
          {categoryIconOptions.map((option) => {
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

      <div>
        <label className={fieldLabel} title="Цвет маркера на карте для этой категории.">
          Цвет
        </label>
        <div className="flex flex-wrap gap-2">
          {categoryColorOptions.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => setForm((p) => ({ ...p, color }))}
              style={{ backgroundColor: color }}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition",
                form.color === color ? "border-foreground" : "border-transparent"
              )}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.isHidden}
            onChange={(e) => setForm((p) => ({ ...p, isHidden: e.target.checked }))}
          />
          Скрытая категория
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Места этой категории видят только пользователи, которым в разделе «Пользователи» включён доступ к скрытым
          категориям.
        </p>
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
