"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Search, UserPlus, UserX, Users, X } from "lucide-react";
import type { FriendEntry, FriendsResponse, FriendUser } from "@/entities/user/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import { apiFetch } from "@/shared/lib/api-fetch";
import { cn } from "@/shared/lib/cn";
import { formatLastSeen } from "@/shared/lib/format-last-seen";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

const EMPTY_RESPONSE: FriendsResponse = { friends: [], incoming: [], outgoing: [] };

export function FriendsCard() {
  const language = useExplorerStore((state) => state.language);
  const t = getTranslations(language).auth;
  const currentUser = useExplorerStore((state) => state.currentUser);

  const [data, setData] = useState<FriendsResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  async function loadFriends() {
    const res = await apiFetch("/api/me/friends");
    if (res.ok) {
      setData((await res.json()) as FriendsResponse);
    }
  }

  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    loadFriends().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      apiFetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => (res.ok ? res.json() : { users: [] }))
        .then((body: { users: FriendUser[] }) => setResults(body.users))
        .finally(() => setIsSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!currentUser) return null;

  const friendIds = new Set(data.friends.map((entry) => entry.user.id));
  const outgoingIds = new Set(data.outgoing.map((entry) => entry.user.id));
  const incomingIds = new Set(data.incoming.map((entry) => entry.user.id));

  async function handleSendRequest(username: string) {
    setRequestError(null);
    setPendingActionId(username);
    try {
      const res = await apiFetch("/api/me/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setRequestError(body.error ?? "Что-то пошло не так.");
        return;
      }
      setQuery("");
      setResults([]);
      await loadFriends();
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleAccept(friendshipId: string) {
    setPendingActionId(friendshipId);
    try {
      await apiFetch(`/api/me/friends/${friendshipId}/accept`, { method: "POST" });
      await loadFriends();
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleRemove(friendshipId: string) {
    setPendingActionId(friendshipId);
    try {
      await apiFetch(`/api/me/friends/${friendshipId}`, { method: "DELETE" });
      await loadFriends();
    } finally {
      setPendingActionId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card/[0.78] p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Users className="h-4 w-4 text-primary" />
        {t.friendsTitle}
      </h2>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.friendsSearchPlaceholder}
          className="w-full rounded-md border border-border bg-card py-1.5 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring/25"
        />
      </div>

      {requestError && <p className="text-xs font-medium text-red-600">{requestError}</p>}

      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-1.5">
          {isSearching ? (
            <p className="text-xs text-muted-foreground">{t.friendsSearching}</p>
          ) : results.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t.friendsNoResults}</p>
          ) : (
            results.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="relative shrink-0">
                    <ProfileAvatar avatarId={user.avatarId} className="h-7 w-7" />
                    {user.isOnline && (
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card bg-emerald-400"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{user.name || `@${user.username}`}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      @{user.username} · {formatLastSeen(user.lastSeenAt, user.isOnline, language)}
                    </p>
                  </div>
                </div>
                {friendIds.has(user.id) ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.friendsAlreadyFriends}</span>
                ) : outgoingIds.has(user.id) ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.friendsRequestSent}</span>
                ) : incomingIds.has(user.id) ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{t.friendsRespondBelow}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleSendRequest(user.username)}
                    disabled={pendingActionId === user.username}
                    className="flex shrink-0 items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-60"
                  >
                    <UserPlus className="h-3 w-3" />
                    {t.friendsAdd}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {data.incoming.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.friendsIncomingTitle}</h3>
          {data.incoming.map((entry) => (
            <FriendRow
              key={entry.id}
              entry={entry}
              busy={pendingActionId === entry.id}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => void handleAccept(entry.id)}
                    disabled={pendingActionId === entry.id}
                    className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" />
                    {t.friendsAccept}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRemove(entry.id)}
                    disabled={pendingActionId === entry.id}
                    className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    <X className="h-3 w-3" />
                    {t.friendsDecline}
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      {data.outgoing.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.friendsOutgoingTitle}</h3>
          {data.outgoing.map((entry) => (
            <FriendRow
              key={entry.id}
              entry={entry}
              busy={pendingActionId === entry.id}
              actions={
                <button
                  type="button"
                  onClick={() => void handleRemove(entry.id)}
                  disabled={pendingActionId === entry.id}
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  <X className="h-3 w-3" />
                  {t.friendsCancel}
                </button>
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t.friendsListTitle}</h3>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">{t.friendsLoading}</p>
        ) : data.friends.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t.friendsEmpty}</p>
        ) : (
          data.friends.map((entry) => (
            <FriendRow
              key={entry.id}
              entry={entry}
              busy={pendingActionId === entry.id}
              actions={
                <button
                  type="button"
                  onClick={() => void handleRemove(entry.id)}
                  disabled={pendingActionId === entry.id}
                  className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-red-600 disabled:opacity-60"
                >
                  <UserX className="h-3 w-3" />
                  {t.friendsRemove}
                </button>
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function FriendRow({ entry, actions, busy }: { entry: FriendEntry; actions: ReactNode; busy: boolean }) {
  const language = useExplorerStore((state) => state.language);
  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5", busy && "opacity-60")}>
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative shrink-0">
          <ProfileAvatar avatarId={entry.user.avatarId} className="h-7 w-7" />
          {entry.user.isOnline && (
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card bg-emerald-400"
            />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{entry.user.name || `@${entry.user.username}`}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            @{entry.user.username} · {formatLastSeen(entry.user.lastSeenAt, entry.user.isOnline, language)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </div>
  );
}
