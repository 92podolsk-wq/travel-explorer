import { useState } from "react";
import type { Category, CategoryInput } from "@/entities/category/model/types";
import type { Selection } from "./types";

export function useCategoriesAdmin(setSelection: (selection: Selection) => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/categories");
    if (!res.ok) throw new Error("Failed to load categories");
    setCategories((await res.json()) as Category[]);
  }

  async function handleCreate(input: CategoryInput) {
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось создать категорию.");
      return;
    }

    const created = (await res.json()) as Category;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: CategoryInput) {
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await load();
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Удалить категорию «${category.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить категорию.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { categories, error, load, handleCreate, handleUpdate, handleDelete };
}
