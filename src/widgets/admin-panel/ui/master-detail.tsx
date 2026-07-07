"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type MasterDetailItem = {
  id: string;
  title: string;
  subtitle?: string;
};

type MasterDetailProps = {
  items: MasterDetailItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  children: React.ReactNode;
};

export function MasterDetail({
  items,
  selectedId,
  onSelect,
  onAdd,
  addLabel,
  searchPlaceholder,
  emptyLabel,
  children
}: MasterDetailProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(normalizedQuery))
    : items;

  return (
    <div className="flex overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div className="flex w-60 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-2.5">
          <div className="mb-2 flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
          >
            <Plus className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-1.5">
          {filteredItems.length === 0 && (
            <p className="p-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
          )}
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-md px-2.5 py-2 text-left transition",
                item.id === selectedId ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  item.id === selectedId ? "text-primary" : "text-foreground"
                )}
              >
                {item.title}
              </span>
              {item.subtitle && (
                <span
                  className={cn(
                    "truncate text-[11px]",
                    item.id === selectedId ? "text-primary/70" : "text-muted-foreground"
                  )}
                >
                  {item.subtitle}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-[420px] flex-1 overflow-y-auto p-5">{children}</div>
    </div>
  );
}
