"use client";

import { useState } from "react";
import { Camera, Plus, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type MasterDetailBadge = {
  label: string;
  tone?: "amber" | "red" | "neutral";
};

export type MasterDetailItem = {
  id: string;
  title: string;
  subtitle?: string;
  badges?: MasterDetailBadge[];
  icon?: LucideIcon;
  photoCount?: number;
};

export type MasterDetailSelection = {
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[]) => void;
  actions: React.ReactNode;
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
  selection?: MasterDetailSelection;
};

export function MasterDetail({
  items,
  selectedId,
  onSelect,
  onAdd,
  addLabel,
  searchPlaceholder,
  emptyLabel,
  children,
  selection
}: MasterDetailProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => `${item.title} ${item.subtitle ?? ""}`.toLowerCase().includes(normalizedQuery))
    : items;
  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((item) => selection?.selectedIds.has(item.id));

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
          {selection && (
            <label className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={() => selection.onToggleAll(filteredItems.map((item) => item.id))}
              />
              Выбрать все
            </label>
          )}
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-1.5">
          {filteredItems.length === 0 && (
            <p className="p-3 text-center text-xs text-muted-foreground">{emptyLabel}</p>
          )}
          {filteredItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex w-full items-start gap-1.5 rounded-md px-2.5 py-2 text-left transition",
                  item.id === selectedId ? "bg-primary/10" : "hover:bg-muted"
                )}
              >
                {selection && (
                  <input
                    type="checkbox"
                    className="mt-1 shrink-0"
                    checked={selection.selectedIds.has(item.id)}
                    onChange={() => selection.onToggle(item.id)}
                  />
                )}
                <button type="button" onClick={() => onSelect(item.id)} className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                  <span className="flex w-full items-center gap-1.5">
                    {ItemIcon && (
                      <ItemIcon
                        className={cn("h-3.5 w-3.5 shrink-0", item.id === selectedId ? "text-primary" : "text-muted-foreground")}
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        item.id === selectedId ? "text-primary" : "text-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                    {item.photoCount !== undefined && (
                      <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Camera className="h-3 w-3" />
                        {item.photoCount}
                      </span>
                    )}
                    {item.badges?.map((badge) => (
                      <span
                        key={badge.label}
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          badge.tone === "red"
                            ? "bg-red-100 text-red-700"
                            : badge.tone === "neutral"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {badge.label}
                      </span>
                    ))}
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
              </div>
            );
          })}
        </div>
      </div>
      <div className="min-h-[420px] flex-1 overflow-y-auto p-5">
        {selection && selection.selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
            <span className="text-xs font-semibold text-foreground">Выбрано: {selection.selectedIds.size}</span>
            {selection.actions}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
