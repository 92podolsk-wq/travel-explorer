"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckSquare, ListChecks, Plus, Share2, Square, X } from "lucide-react";
import type { ChecklistItem, PackingChecklist } from "@/entities/checklist/model/types";
import type { FriendUser } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { Input } from "@/shared/ui/input";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { readChecklistState, writeChecklistState, type PackingChecklistState } from "@/shared/lib/packing-checklist-storage";

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
  const dict = getTranslations(language);
  const appT = dict.app;
  const t = dict.auth;
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [state, setState] = useState<PackingChecklistState | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [shareTargetIds, setShareTargetIds] = useState<Set<string>>(new Set());
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      apiFetch("/api/me/checklist")
        .then((res) => res.json())
        .then((body: { checklist: PackingChecklist }) => setState(body.checklist));
    } else {
      setState(readChecklistState());
    }
  }, [currentUser?.id]);

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

  const dateLocale = language === "ru" ? "ru-RU" : language === "ja" ? "ja-JP" : "en-US";
  const dateLabel = state.tripDate
    ? appT.checklistDateSet.replace(
        "{date}",
        new Date(state.tripDate).toLocaleDateString(dateLocale, { day: "numeric", month: "long" })
      )
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
