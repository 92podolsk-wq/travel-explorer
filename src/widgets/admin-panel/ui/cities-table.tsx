"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from "lucide-react";
import type { Area } from "@/entities/area/model/types";
import type { Country } from "@/entities/country/model/types";
import type { Poi } from "@/entities/poi/model/types";
import type { Region } from "@/entities/region/model/types";
import { cn } from "@/shared/lib/cn";
import { missingLanguages } from "@/shared/lib/translation-completeness";

type SortKey = "name" | "area" | "status" | "locations";
type SortDir = "asc" | "desc";

type CitiesTableProps = {
  regions: Region[];
  areas: Area[];
  countries: Country[];
  pois: Poi[];
  onSelect: (id: string) => void;
  onAdd: () => void;
};

const columns: { key: SortKey; label: string }[] = [
  { key: "name", label: "Название" },
  { key: "area", label: "Регион" },
  { key: "status", label: "Статус" },
  { key: "locations", label: "Локаций" }
];

export function CitiesTable({ regions, areas, countries, pois, onSelect, onAdd }: CitiesTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const areaLabel = (region: Region) => {
    const area = areas.find((item) => item.id === region.areaId);
    const country = area ? countries.find((item) => item.id === area.countryId) : undefined;
    return area && country ? `${area.name}, ${country.name}` : (area?.name ?? "");
  };
  const locationCount = (regionId: string) => pois.filter((poi) => poi.regionId === regionId).length;

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? regions.filter((region) => `${region.name} ${areaLabel(region)}`.toLowerCase().includes(normalizedQuery))
    : regions;

  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === "name") diff = a.name.localeCompare(b.name);
    else if (sortKey === "area") diff = areaLabel(a).localeCompare(areaLabel(b));
    else if (sortKey === "status") diff = a.status.localeCompare(b.status);
    else if (sortKey === "locations") diff = locationCount(a.id) - locationCount(b.id);
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

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2.5">
        <div className="flex flex-1 items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск города"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить город
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
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
              <th className="px-3 py-2.5 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Городов пока нет
                </td>
              </tr>
            )}
            {sorted.map((region) => (
              <tr key={region.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-3 py-2 font-medium text-foreground">
                  <button type="button" onClick={() => onSelect(region.id)} className="inline-flex items-center gap-1.5 hover:underline">
                    {region.name} <span className="text-muted-foreground">({region.sealCharacter})</span>
                    {missingLanguages([region.nameByLanguage]).length > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Нет перевода</span>
                    )}
                  </button>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{areaLabel(region)}</td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      region.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                    )}
                  >
                    {region.status === "draft" ? "Черновик" : "Опубликован"}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{locationCount(region.id)}</td>
                <td className="px-3 py-2 text-right">
                  <button type="button" onClick={() => onSelect(region.id)} className="text-xs font-medium text-primary hover:underline">
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
