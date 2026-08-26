import { useState } from "react";
import type { Poi, PoiInput } from "@/entities/poi/model/types";
import type { TrashedPoi } from "@/shared/server/pois-repository";
import type { Selection } from "./types";

export function useLocationsAdmin(setSelection: (selection: Selection) => void) {
  const [pois, setPois] = useState<Poi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [locationCityFilter, setLocationCityFilter] = useState<string>("all");
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [trash, setTrash] = useState<TrashedPoi[]>([]);
  const [bulkCityTarget, setBulkCityTarget] = useState<string>("");
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState<string>("");
  const [isBulkWorking, setIsBulkWorking] = useState(false);

  async function load() {
    const res = await fetch("/api/pois");
    if (!res.ok) throw new Error("Failed to load pois");
    setPois((await res.json()) as Poi[]);
  }

  async function handleCreate(input: PoiInput) {
    setError(null);
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось создать локацию.");
      return;
    }

    const created = (await res.json()) as Poi;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: PoiInput) {
    setError(null);
    const res = await fetch(`/api/pois/${id}`, {
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

  async function handleDelete(poi: Poi) {
    if (!window.confirm(`Удалить «${poi.name}»? Локацию можно будет восстановить из корзины.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/pois/${poi.id}`, { method: "DELETE" });

    if (!res.ok) {
      setError("Не удалось удалить локацию.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  async function handleDuplicate(poi: Poi) {
    setError(null);
    const input: PoiInput = {
      regionId: poi.regionId,
      name: `${poi.name} (копия)`,
      nameByLanguage: poi.nameByLanguage,
      coordinates: poi.coordinates,
      description: poi.description,
      descriptionByLanguage: poi.descriptionByLanguage,
      rating: poi.rating,
      photos: poi.photos,
      category: poi.category,
      tags: poi.tags,
      seasons: poi.seasons,
      photoScore: poi.photoScore,
      difficulty: poi.difficulty,
      durationMinutes: poi.durationMinutes,
      importance: poi.importance,
      status: "draft"
    };
    const res = await fetch("/api/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      setError("Не удалось дублировать локацию.");
      return;
    }

    const created = (await res.json()) as Poi;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelected() {
    setSelectedIds(new Set());
  }

  function toggleAllSelected(ids: string[]) {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(ids);
    });
  }

  async function handleBulkSetStatus(status: "draft" | "published") {
    setError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => selectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, status })
          })
        )
      );
      setSelectedIds(new Set());
      await load();
    } finally {
      setIsBulkWorking(false);
    }
  }

  async function handleBulkDelete() {
    if (!window.confirm(`Удалить выбранные локации (${selectedIds.size})? Их можно будет восстановить из корзины.`)) {
      return;
    }

    setError(null);
    setIsBulkWorking(true);
    try {
      await Promise.all([...selectedIds].map((id) => fetch(`/api/pois/${id}`, { method: "DELETE" })));
      setSelectedIds(new Set());
      setSelection({ mode: "empty" });
      await load();
    } finally {
      setIsBulkWorking(false);
    }
  }

  async function loadTrash() {
    setError(null);
    const res = await fetch("/api/admin/locations-trash");
    if (!res.ok) {
      setError("Не удалось загрузить корзину.");
      return;
    }
    setTrash((await res.json()) as TrashedPoi[]);
  }

  async function handleOpenTrash() {
    setIsTrashOpen(true);
    await loadTrash();
  }

  async function handleRestore(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/locations-trash/${id}`, { method: "POST" });
    if (!res.ok) {
      setError("Не удалось восстановить локацию.");
      return;
    }
    await Promise.all([loadTrash(), load()]);
  }

  async function handlePurge(id: string) {
    if (!window.confirm("Удалить локацию навсегда? Это действие нельзя отменить.")) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/locations-trash/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Не удалось удалить локацию навсегда.");
      return;
    }
    await loadTrash();
  }

  async function handleBulkChangeCity() {
    if (!bulkCityTarget) return;
    setError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => selectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, regionId: bulkCityTarget })
          })
        )
      );
      setSelectedIds(new Set());
      setBulkCityTarget("");
      await load();
    } finally {
      setIsBulkWorking(false);
    }
  }

  async function handleBulkChangeCategory() {
    if (!bulkCategoryTarget) return;
    setError(null);
    setIsBulkWorking(true);
    try {
      const targets = pois.filter((poi) => selectedIds.has(poi.id));
      await Promise.all(
        targets.map((poi) =>
          fetch(`/api/pois/${poi.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...poi, category: bulkCategoryTarget })
          })
        )
      );
      setSelectedIds(new Set());
      setBulkCategoryTarget("");
      await load();
    } finally {
      setIsBulkWorking(false);
    }
  }

  return {
    pois,
    error,
    locationCityFilter,
    setLocationCityFilter,
    showDraftsOnly,
    setShowDraftsOnly,
    selectedIds,
    isTrashOpen,
    setIsTrashOpen,
    trash,
    bulkCityTarget,
    setBulkCityTarget,
    bulkCategoryTarget,
    setBulkCategoryTarget,
    isBulkWorking,
    load,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleDuplicate,
    toggleSelected,
    clearSelected,
    toggleAllSelected,
    handleBulkSetStatus,
    handleBulkDelete,
    handleOpenTrash,
    handleRestore,
    handlePurge,
    handleBulkChangeCity,
    handleBulkChangeCategory
  };
}
