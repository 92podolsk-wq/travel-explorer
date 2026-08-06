"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks, Plus, Square, X } from "lucide-react";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Input } from "@/shared/ui/input";
import {
  readChecklistState,
  writeChecklistState,
  type ChecklistItem,
  type PackingChecklistState
} from "@/shared/lib/packing-checklist-storage";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ChecklistSection({
  title,
  items,
  addPlaceholder,
  onToggle,
  onRemove,
  onAdd
}: {
  title: string;
  items: ChecklistItem[];
  addPlaceholder: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold text-foreground">{title}</h3>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-0">
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              {item.checked ? (
                <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Square className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={`truncate text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {item.label}
              </span>
            </button>
            <button type="button" onClick={() => onRemove(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={addPlaceholder}
          className="h-9 text-xs"
        />
        <button
          type="button"
          onClick={submit}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function PackingChecklistCard() {
  const language = useExplorerStore((state) => state.language);
  const appT = getTranslations(language).app;
  const [state, setState] = useState<PackingChecklistState | null>(null);

  useEffect(() => {
    setState(readChecklistState());
  }, []);

  function applyPatch(patch: Partial<PackingChecklistState>) {
    setState((current) => {
      if (!current) return current;
      const updated = { ...current, ...patch };
      writeChecklistState(updated);
      return updated;
    });
  }

  if (!state) return null;

  const dateLocale = language === "ru" ? "ru-RU" : language === "ja" ? "ja-JP" : "en-US";
  const dateLabel = state.tripDate
    ? appT.checklistDateSet.replace(
        "{date}",
        new Date(state.tripDate).toLocaleDateString(dateLocale, { day: "numeric", month: "long" })
      )
    : appT.checklistSetDate;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <ListChecks className="h-4 w-4 text-primary" />
        {appT.checklistCardTitle}
      </h2>

      <label className="relative inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
        <CalendarDays className="h-3.5 w-3.5" />
        {dateLabel}
        <input
          type="date"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={state.tripDate ? state.tripDate.slice(0, 10) : ""}
          onChange={(event) => applyPatch({ tripDate: event.target.value ? new Date(event.target.value).toISOString() : null })}
        />
      </label>

      <ChecklistSection
        title={appT.checklistPackingTitle}
        items={state.packingItems}
        addPlaceholder={appT.checklistAddPlaceholder}
        onToggle={(id) =>
          applyPatch({
            packingItems: state.packingItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
          })
        }
        onRemove={(id) => applyPatch({ packingItems: state.packingItems.filter((item) => item.id !== id) })}
        onAdd={(label) => applyPatch({ packingItems: [...state.packingItems, { id: makeId(), label, checked: false }] })}
      />

      <div className="h-px bg-border" />

      <ChecklistSection
        title={appT.checklistShoppingTitle}
        items={state.shoppingItems}
        addPlaceholder={appT.checklistAddPlaceholder}
        onToggle={(id) =>
          applyPatch({
            shoppingItems: state.shoppingItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
          })
        }
        onRemove={(id) => applyPatch({ shoppingItems: state.shoppingItems.filter((item) => item.id !== id) })}
        onAdd={(label) => applyPatch({ shoppingItems: [...state.shoppingItems, { id: makeId(), label, checked: false }] })}
      />
    </section>
  );
}
