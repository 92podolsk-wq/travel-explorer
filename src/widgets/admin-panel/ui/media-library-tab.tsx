"use client";

import { useEffect, useMemo, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { Region } from "@/entities/region/model/types";
import { cn } from "@/shared/lib/cn";

type PhotoWithPoi = {
  id: string;
  poiId: string;
  poiName: string;
  regionId: string;
  url: string;
  alt: string;
  author: string | null;
  season: string | null;
  position: number;
};

type MediaLibraryTabProps = {
  regions: Region[];
};

export function MediaLibraryTab({ regions }: MediaLibraryTabProps) {
  const [photos, setPhotos] = useState<PhotoWithPoi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [dragState, setDragState] = useState<{ poiId: string; photoId: string } | null>(null);

  async function loadPhotos() {
    const res = await fetch("/api/admin/photos");
    if (!res.ok) {
      setError("Не удалось загрузить фото.");
      return;
    }
    setPhotos((await res.json()) as PhotoWithPoi[]);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  const groups = useMemo(() => {
    const filtered = cityFilter === "all" ? photos : photos.filter((photo) => photo.regionId === cityFilter);
    const byPoi = new Map<string, { poiId: string; poiName: string; photos: PhotoWithPoi[] }>();
    for (const photo of filtered) {
      const group = byPoi.get(photo.poiId) ?? { poiId: photo.poiId, poiName: photo.poiName, photos: [] };
      group.photos.push(photo);
      byPoi.set(photo.poiId, group);
    }
    return Array.from(byPoi.values()).sort((a, b) => a.poiName.localeCompare(b.poiName));
  }, [photos, cityFilter]);

  const handleAltBlur = async (photo: PhotoWithPoi, value: string) => {
    if (value === photo.alt) return;
    setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, alt: value } : p)));
    await fetch(`/api/admin/photos/${photo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt: value })
    });
  };

  const handleDelete = async (photo: PhotoWithPoi) => {
    if (!window.confirm("Удалить это фото?")) return;
    const res = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Не удалось удалить фото.");
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  const handleDrop = async (poiId: string, targetPhotoId: string) => {
    if (!dragState || dragState.poiId !== poiId || dragState.photoId === targetPhotoId) {
      setDragState(null);
      return;
    }

    const group = groups.find((g) => g.poiId === poiId);
    if (!group) return;

    const ids = group.photos.map((p) => p.id);
    const fromIndex = ids.indexOf(dragState.photoId);
    const toIndex = ids.indexOf(targetPhotoId);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = [...ids];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, dragState.photoId);

    setPhotos((prev) => {
      const positionById = new Map(reordered.map((id, index) => [id, index]));
      return prev.map((p) => (positionById.has(p.id) ? { ...p, position: positionById.get(p.id)! } : p));
    });
    setDragState(null);

    await fetch("/api/admin/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId, orderedIds: reordered })
    });
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Город</label>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-white px-2.5 text-sm shadow-sm outline-none"
        >
          <option value="all">Все города</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 && <p className="text-sm text-muted-foreground">Фото не найдены.</p>}

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.poiId} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-foreground">{group.poiName}</p>
            <div className="flex flex-wrap gap-3">
              {group.photos.map((photo) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => setDragState({ poiId: group.poiId, photoId: photo.id })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(group.poiId, photo.id)}
                  className={cn(
                    "flex w-40 shrink-0 flex-col overflow-hidden rounded-md border border-border bg-white transition",
                    dragState?.photoId === photo.id && "opacity-50"
                  )}
                >
                  <div className="relative h-24 w-full bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
                    <div className="absolute left-1 top-1 cursor-grab rounded bg-white/80 p-0.5">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(photo)}
                      className="absolute right-1 top-1 rounded bg-white/80 p-0.5 text-red-600 transition hover:bg-white"
                      aria-label="Удалить фото"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <input
                    defaultValue={photo.alt}
                    onBlur={(e) => handleAltBlur(photo, e.target.value)}
                    className="w-full border-t border-border px-1.5 py-1 text-[11px] outline-none focus:bg-muted/40"
                    placeholder="Подпись (alt)"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
