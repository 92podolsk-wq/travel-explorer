import { useState } from "react";
import type { ExplorationMode, ExplorationModeInput } from "@/entities/exploration-mode/model/types";
import type { Selection } from "./types";

export function useModesAdmin(setSelection: (selection: Selection) => void) {
  const [explorationModes, setExplorationModes] = useState<ExplorationMode[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/exploration-modes");
    if (!res.ok) throw new Error("Failed to load exploration modes");
    setExplorationModes((await res.json()) as ExplorationMode[]);
  }

  async function handleCreate(input: ExplorationModeInput) {
    setError(null);
    const res = await fetch("/api/exploration-modes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось создать режим.");
      return;
    }

    const created = (await res.json()) as ExplorationMode;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: ExplorationModeInput) {
    setError(null);
    const res = await fetch(`/api/exploration-modes/${id}`, {
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

  async function handleDelete(mode: ExplorationMode) {
    if (!window.confirm(`Удалить режим «${mode.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/exploration-modes/${mode.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить режим.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { explorationModes, error, load, handleCreate, handleUpdate, handleDelete };
}
