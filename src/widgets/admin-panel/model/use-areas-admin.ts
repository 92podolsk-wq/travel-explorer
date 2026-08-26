import { useState } from "react";
import type { Area, AreaInput } from "@/entities/area/model/types";
import type { Selection } from "./types";

export function useAreasAdmin(setSelection: (selection: Selection) => void) {
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/areas");
    if (!res.ok) throw new Error("Failed to load areas");
    setAreas((await res.json()) as Area[]);
  }

  async function handleCreate(input: AreaInput) {
    setError(null);
    const res = await fetch("/api/areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось создать регион.");
      return;
    }

    const created = (await res.json()) as Area;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: AreaInput) {
    setError(null);
    const res = await fetch(`/api/areas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось сохранить изменения.");
      return;
    }

    await load();
  }

  async function handleDelete(area: Area) {
    if (!window.confirm(`Удалить «${area.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/areas/${area.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить регион.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { areas, error, load, handleCreate, handleUpdate, handleDelete };
}
