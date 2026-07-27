"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Camera, Plus, Search } from "lucide-react";
import type { Category } from "@/entities/category/model/types";
import type { Poi } from "@/entities/poi/model/types";
import { getCategoryIcon } from "@/entities/poi/ui/category-icon";
import type { Region } from "@/entities/region/model/types";
import { cn } from "@/shared/lib/cn";

type SortKey = "name" | "city" | "status" | "photos";
type SortDir = "asc" | "desc";

type LocationsTableSelection = {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  actions: React.ReactNode;
};

type LocationsTableProps = {
  pois: Poi[];
  regions: Region[];
  categories: Category[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  selection: LocationsTableSelection;
};

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Название" },
  { key: "city", label: "Город" },
  { key: "status", label: "Статус" },
  { key: "photos", label: "Фото" }
];

export function LocationsTable({ pois, regions, categories, onSelect, onAdd, selection }: LocationsTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const cityName = (regionId: string) => regions.find((region) => region.id === regionId)?.name ?? regionId;
  const categoryName = (categoryId: string) => categories.find((category) => category.id === categoryId)?.name ?? categoryId;

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? pois.filter((poi) => `${poi.name} ${cityName(poi.regionId)}`.toLowerCase().includes(normalizedQuery))
    : pois;

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === "name") diff = a.name.localeCompare(b.name);
    else if (sortKey === "city") diff = cityName(a.regionId).localeCompare(cityName(b.regionId));
    else if (sortKey === "status") diff = a.status.localeCompare(b.status);
    else if (sortKey === "photos") diff = a.photos.length - b.photos.length;
    return sortDir === "asc" ? diff : -diff;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const allFilteredSelected = sorted.length > 0 && sorted.every((poi) => selection.selectedIds.has(poi.id));

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск локации"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить локацию
        </button>
      </div>

      {selection.selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 p-2.5">
          <span className="text-xs font-semibold text-foreground">Выбрано: {selection.selectedIds.size}</span>
          {selection.actions}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={() => selection.onToggleAll(sorted.map((poi) => poi.id))}
                />
              </th>
              <th className="w-14 px-2 py-2.5"></th>
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2.5">
                  <button type="button" onClick={() => toggleSort(column.key)} className="flex items-center gap-1 hover:text-foreground">
                    {column.label}
                    {sortKey === column.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5">Категория</th>
              <th className="px-3 py-2.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Локаций пока нет
                </td>
              </tr>
            )}
            {sorted.map((poi) => {
              const CategoryIcon = getCategoryIcon(categories, poi.category);
              return (
                <tr key={poi.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selection.selectedIds.has(poi.id)} onChange={() => selection.onToggle(poi.id)} />
                  </td>
                  <td className="px-2 py-2">
                    {poi.photos[0] ? (
                      <img src={poi.photos[0].url} alt="" className="h-9 w-9 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Camera className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-foreground">
                    <button type="button" onClick={() => onSelect(poi.id)} className="hover:underline">
                      {poi.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{cityName(poi.regionId)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        poi.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      )}
                    >
                      {poi.status === "draft" ? "Черновик" : "Опубликован"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" />
                      {poi.photos.length}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CategoryIcon className="h-3.5 w-3.5" />
                      {categoryName(poi.category)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" onClick={() => onSelect(poi.id)} className="text-xs font-medium text-primary hover:underline">
                      Открыть
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
