"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  Share2,
  Sparkles,
  Square,
  Trash2
} from "lucide-react";
import type { ChecklistItem, PackingChecklist } from "@/entities/checklist/model/types";
import type { FriendUser } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { cn } from "@/shared/lib/cn";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Input } from "@/shared/ui/input";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { readChecklistState, writeChecklistState, type PackingChecklistState } from "@/shared/lib/packing-checklist-storage";

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type ChecklistFilter = "all" | "incomplete" | "complete";

function filterItems(items: ChecklistItem[], filter: ChecklistFilter): ChecklistItem[] {
  if (filter === "incomplete") return items.filter((item) => !item.checked);
  if (filter === "complete") return items.filter((item) => item.checked);
  return items;
}

function ChecklistSection({
  emoji,
  title,
  items,
  filter,
  isOpen,
  onToggleOpen,
  addPlaceholder,
  deleteLabel,
  onToggle,
  onRemove,
  onAdd
}: {
  emoji: string;
  title: string;
  items: ChecklistItem[];
  filter: ChecklistFilter;
  isOpen: boolean;
  onToggleOpen: () => void;
  addPlaceholder: string;
  deleteLabel: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (label: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const visibleItems = filterItems(items, filter);
  const doneCount = items.filter((item) => item.checked).length;

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
    setIsAdding(false);
  }

  return (
    <div className="rounded-md border border-border/60">
      <button
        type="button"
        onClick={onToggleOpen}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <span aria-hidden>{emoji}</span>
          {title}
        </span>
        <span className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          {doneCount}/{items.length}
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-border/60 px-3 pb-3 pt-2">
          <ul className="flex flex-col">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-2 border-b border-border py-1.5 last:border-0"
              >
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
                  <span
                    className={cn(
                      "truncate text-sm",
                      item.checked ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={deleteLabel}
                  className="shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          {isAdding ? (
            <div className="mt-2 flex items-center gap-2">
              <Input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                  if (event.key === "Escape") setIsAdding(false);
                }}
                onBlur={() => {
                  if (!draft.trim()) setIsAdding(false);
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
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {addPlaceholder}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PackingChecklistCard() {
  const language = useExplorerStore((state) => state.language);
  const dict = getTranslations(language);
  const appT = dict.app;
  const t = dict.auth;
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [state, setState] = useState<PackingChecklistState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [shareTargetIds, setShareTargetIds] = useState<Set<string>>(new Set());
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChecklistFilter>("all");
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set());
  const [tripNameDraft, setTripNameDraft] = useState("");

  useEffect(() => {
    if (currentUser) {
      apiFetch("/api/me/checklist")
        .then((res) => res.json())
        .then((body: { checklist: PackingChecklist }) => setState(body.checklist));
    } else {
      setState(readChecklistState());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    setTripNameDraft(state?.tripName ?? "");
  }, [state?.tripName]);

  useEffect(() => {
    if (state && state.categories.length > 0) {
      setOpenCategoryIds((prev) => (prev.size === 0 ? new Set([state.categories[0].id]) : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state === null]);

  function applyPatch(patch: Partial<PackingChecklistState>) {
    setState((current) => {
      if (!current) return current;
      const updated = { ...current, ...patch };
      if (currentUser) {
        apiFetch("/api/me/checklist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch)
        }).catch(() => {});
      } else {
        writeChecklistState(updated);
      }
      return updated;
    });
  }

  function openShare() {
    setIsShareOpen((value) => !value);
    if (friends.length === 0) {
      apiFetch("/api/me/friends")
        .then((res) => res.json())
        .then((body: { friends: { user: FriendUser }[] }) => setFriends(body.friends.map((entry) => entry.user)));
    }
    apiFetch("/api/me/checklist/shares")
      .then((res) => res.json())
      .then((body: { users: FriendUser[] }) => setShareTargetIds(new Set(body.users.map((user) => user.id))));
  }

  async function toggleShare(friendId: string, isShared: boolean) {
    setPendingShareId(friendId);
    try {
      if (isShared) {
        await apiFetch(`/api/me/checklist/shares/${friendId}`, { method: "DELETE" });
        setShareTargetIds((prev) => {
          const next = new Set(prev);
          next.delete(friendId);
          return next;
        });
      } else {
        await apiFetch("/api/me/checklist/shares", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendUserId: friendId })
        });
        setShareTargetIds((prev) => new Set(prev).add(friendId));
      }
    } finally {
      setPendingShareId(null);
    }
  }

  if (!state) return null;

  const dateLocale = language === "ru" ? "ru-RU" : "en-US";
  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "long" });
  }

  const daysUntilTrip = (() => {
    if (!state.tripStartDate) return null;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfTrip = new Date(state.tripStartDate).setHours(0, 0, 0, 0);
    const days = Math.round((startOfTrip - startOfToday) / 86_400_000);
    return days >= 0 ? days : null;
  })();

  const totalCount = state.categories.reduce((sum, category) => sum + category.items.length, 0);
  const doneCount = state.categories.reduce(
    (sum, category) => sum + category.items.filter((item) => item.checked).length,
    0
  );
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && doneCount === totalCount;

  function updateCategoryItems(categoryId: string, updater: (items: ChecklistItem[]) => ChecklistItem[]) {
    applyPatch({
      categories: state!.categories.map((category) =>
        category.id === categoryId ? { ...category, items: updater(category.items) } : category
      )
    });
  }

  function toggleCategoryOpen(categoryId: string) {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function commitTripName() {
    const trimmed = tripNameDraft.trim();
    if (trimmed !== (state!.tripName ?? "")) {
      applyPatch({ tripName: trimmed || null });
    }
  }

  const tripSubtitle = state.tripStartDate
    ? state.tripEndDate
      ? `${formatDate(state.tripStartDate)} – ${formatDate(state.tripEndDate)}`
      : formatDate(state.tripStartDate)
    : appT.checklistSetDate;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ListChecks className="h-4 w-4 text-primary" />
          {appT.checklistCardTitle}
        </h2>
        {currentUser && (
          <button
            type="button"
            onClick={openShare}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            <Share2 className="h-3 w-3" />
            {t.shareChecklist}
          </button>
        )}
      </div>

      {isShareOpen && currentUser && (
        <div className="flex flex-col gap-1.5 rounded-md bg-muted/40 p-2.5">
          {friends.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.friendsEmpty}</p>
          ) : (
            friends.map((friend) => {
              const isShared = shareTargetIds.has(friend.id);
              return (
                <div key={friend.id} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ProfileAvatar avatarId={friend.avatarId} className="h-6 w-6 shrink-0" />
                    <span className="truncate text-xs font-medium text-foreground">{friend.name || `@${friend.username}`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleShare(friend.id, isShared)}
                    disabled={pendingShareId === friend.id}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold disabled:opacity-60 ${
                      isShared
                        ? "border border-border text-muted-foreground hover:text-foreground"
                        : "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {isShared ? t.friendsRemove : t.friendsAdd}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-md bg-muted/40 p-3">
        <Input
          value={tripNameDraft}
          onChange={(event) => setTripNameDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onBlur={commitTripName}
          placeholder={appT.checklistTripNamePlaceholder}
          className="h-8 border-none bg-transparent px-0 text-sm font-bold text-foreground shadow-none focus-visible:ring-0"
        />

        <div className="flex items-center gap-2">
          <label className="relative flex flex-1 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            {state.tripStartDate ? formatDate(state.tripStartDate) : appT.checklistSetDate}
            <input
              type="date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={state.tripStartDate ? state.tripStartDate.slice(0, 10) : ""}
              onChange={(event) =>
                applyPatch({ tripStartDate: event.target.value ? new Date(event.target.value).toISOString() : null })
              }
            />
          </label>
          <label className="relative flex flex-1 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            {state.tripEndDate ? formatDate(state.tripEndDate) : appT.checklistSetDate}
            <input
              type="date"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              value={state.tripEndDate ? state.tripEndDate.slice(0, 10) : ""}
              onChange={(event) =>
                applyPatch({ tripEndDate: event.target.value ? new Date(event.target.value).toISOString() : null })
              }
            />
          </label>
        </div>

        {daysUntilTrip != null && (
          <p className="text-[11px] text-muted-foreground">
            {tripSubtitle} · {appT.checklistDaysUntilTrip.replace("{n}", String(daysUntilTrip))}
          </p>
        )}

        {totalCount > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>
                {doneCount} / {totalCount}
              </span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {isAllDone && (
        <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs text-primary">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{appT.checklistAllDoneTitle}</span> {appT.checklistAllDoneBody}
          </span>
        </div>
      )}

      <div className="flex gap-1.5 rounded-md border border-border bg-muted/30 p-1">
        {(
          [
            { id: "all", label: appT.checklistFilterAll, count: totalCount },
            { id: "incomplete", label: appT.checklistFilterIncomplete, count: totalCount - doneCount },
            { id: "complete", label: appT.checklistFilterComplete, count: doneCount }
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={cn(
              "flex-1 rounded px-2 py-1.5 text-[11px] font-semibold transition",
              filter === option.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label} {option.count}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {state.categories.map((category) => (
          <ChecklistSection
            key={category.id}
            emoji={category.emoji}
            title={category.title}
            items={category.items}
            filter={filter}
            isOpen={openCategoryIds.has(category.id)}
            onToggleOpen={() => toggleCategoryOpen(category.id)}
            addPlaceholder={appT.checklistAddPlaceholder}
            deleteLabel={appT.checklistDeleteItem}
            onToggle={(id) =>
              updateCategoryItems(category.id, (items) =>
                items.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
              )
            }
            onRemove={(id) => updateCategoryItems(category.id, (items) => items.filter((item) => item.id !== id))}
            onAdd={(label) =>
              updateCategoryItems(category.id, (items) => [...items, { id: makeId(), label, checked: false }])
            }
          />
        ))}
      </div>
    </section>
  );
}
