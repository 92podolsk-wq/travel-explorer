"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type GlobalSearchResultType = "location" | "city" | "country" | "area" | "mode" | "category";

export type GlobalSearchResult = {
  type: GlobalSearchResultType;
  id: string;
  label: string;
  sublabel?: string;
};

const typeLabels: Record<GlobalSearchResultType, string> = {
  location: "Локация",
  city: "Город",
  country: "Страна",
  area: "Регион",
  mode: "Режим",
  category: "Категория"
};

type GlobalSearchProps = {
  results: GlobalSearchResult[];
  onSelect: (result: GlobalSearchResult) => void;
  className?: string;
};

export function GlobalSearch({ results, onSelect, className }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matches =
    normalizedQuery.length > 0
      ? results.filter((result) => `${result.label} ${result.sublabel ?? ""}`.toLowerCase().includes(normalizedQuery)).slice(0, 12)
      : [];

  function select(result: GlobalSearchResult) {
    onSelect(result);
    setQuery("");
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по всей админке"
          className="h-9 w-full rounded-md border border-border bg-white pl-8 pr-2.5 text-sm outline-none focus:border-primary/30"
        />
      </div>

      {normalizedQuery.length > 0 && (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setQuery("")} />
          <div className="absolute left-0 top-full z-40 mt-1.5 max-h-80 w-full min-w-[320px] overflow-y-auto rounded-lg border border-border bg-white p-1.5 shadow-panel">
            {matches.length === 0 ? (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">Ничего не найдено</p>
            ) : (
              matches.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => select(result)}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm transition hover:bg-muted/60"
                >
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {typeLabels[result.type]}
                  </span>
                  <span className="truncate text-foreground">{result.label}</span>
                  {result.sublabel && <span className="truncate text-xs text-muted-foreground">{result.sublabel}</span>}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
