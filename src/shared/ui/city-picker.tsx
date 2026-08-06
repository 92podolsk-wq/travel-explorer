"use client";

import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type CityPickerOption = {
  id: string;
  name: string;
};

type CityPickerProps = {
  options: CityPickerOption[];
  value: string;
  onChange: (id: string) => void;
  frequentIds?: string[];
  allowAll?: boolean;
  allLabel?: string;
  searchPlaceholder?: string;
  className?: string;
};

export function CityPicker({
  options,
  value,
  onChange,
  frequentIds = [],
  allowAll = false,
  allLabel = "Все города",
  searchPlaceholder = "Или найдите другой город",
  className
}: CityPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const current = value === "all" ? allLabel : (options.find((option) => option.id === value)?.name ?? "");

  const frequentOptions = frequentIds
    .map((id) => options.find((option) => option.id === id))
    .filter((option): option is CityPickerOption => Boolean(option));

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = normalizedQuery.length > 0 ? options.filter((option) => option.name.toLowerCase().includes(normalizedQuery)) : [];

  function select(id: string) {
    onChange(id);
    setIsOpen(false);
    setQuery("");
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex h-9 w-full items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-sm shadow-sm outline-none"
      >
        <span className="flex-1 truncate text-left">{current}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <button type="button" aria-label="Close" className="fixed inset-0 z-30 cursor-default" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-lg border border-border bg-card p-2.5 shadow-panel">
            {(allowAll || frequentOptions.length > 0) && (
              <div className="mb-2">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Часто используемые</p>
                <div className="flex flex-wrap gap-1.5">
                  {allowAll && (
                    <button
                      type="button"
                      onClick={() => select("all")}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        value === "all" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/40 text-foreground hover:bg-muted"
                      )}
                    >
                      {allLabel}
                    </button>
                  )}
                  {frequentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => select(option.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        value === option.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-foreground hover:bg-muted"
                      )}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="h-8 w-full rounded-md border border-border bg-card pl-7 pr-2 text-sm outline-none focus:border-primary/30"
              />
            </div>
            {normalizedQuery.length > 0 && (
              <div className="mt-1.5 max-h-48 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="px-2 py-1.5 text-xs text-muted-foreground">Ничего не найдено</p>
                ) : (
                  searchResults.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => select(option.id)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground transition hover:bg-muted/60"
                    >
                      <span className="truncate">{option.name}</span>
                      {option.id === value && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
