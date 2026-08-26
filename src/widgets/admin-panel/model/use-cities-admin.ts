import { useState } from "react";
import type { Region, RegionInput } from "@/entities/region/model/types";
import type { Selection } from "./types";

export function useCitiesAdmin(setSelection: (selection: Selection) => void) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/regions");
    if (!res.ok) throw new Error("Failed to load regions");
    setRegions((await res.json()) as Region[]);
  }

  async function handleCreate(input: RegionInput) {
    setError(null);
    const res = await fetch("/api/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось создать город.");
      return;
    }

    const created = (await res.json()) as Region;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: RegionInput) {
    setError(null);
    const res = await fetch(`/api/regions/${id}`, {
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

  async function handleDelete(region: Region) {
    if (!window.confirm(`Удалить «${region.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/regions/${region.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить город.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { regions, error, load, handleCreate, handleUpdate, handleDelete };
}
