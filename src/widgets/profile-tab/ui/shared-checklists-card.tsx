"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Square, Users2 } from "lucide-react";
import type { SharedChecklist } from "@/entities/sharing/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

export function SharedChecklistsCard() {
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language).auth;
  const currentUser = useExplorerStore((state) => state.currentUser);
  const [shared, setShared] = useState<SharedChecklist[] | null>(null);
  const [openOwnerId, setOpenOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    apiFetch("/api/me/checklists/shared-with-me")
      .then((res) => res.json())
      .then((body: { checklists: SharedChecklist[] }) => setShared(body.checklists));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (!currentUser || !shared || shared.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Users2 className="h-4 w-4 text-primary" />
        {t.sharedChecklistsTitle}
      </h2>
      {shared.map(({ owner, checklist }) => {
        const isOpen = openOwnerId === owner.id;
        const allItems = [
          ...checklist.packingItems,
          ...checklist.documentItems,
          ...checklist.shoppingItems,
          ...checklist.departureItems
        ];
        const totalItems = allItems.length;
        const checkedItems = allItems.filter((item) => item.checked).length;
        return (
          <div key={owner.id} className="rounded-md bg-muted/40 p-2.5">
            <button
              type="button"
              onClick={() => setOpenOwnerId(isOpen ? null : owner.id)}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <ProfileAvatar avatarId={owner.avatarId} className="h-7 w-7 shrink-0" />
                <span className="truncate text-xs font-semibold text-foreground">{owner.name || `@${owner.username}`}</span>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {checkedItems}/{totalItems}
              </span>
            </button>
            {isOpen && (
              <div className="mt-2 flex flex-col gap-1">
                {allItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    {item.checked ? (
                      <CheckSquare className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Square className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className={item.checked ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
