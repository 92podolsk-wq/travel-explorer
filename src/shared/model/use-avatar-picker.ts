"use client";

import { useState } from "react";
import type { AvatarId } from "@/entities/user/model/avatars";
import type { User } from "@/entities/user/model/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { useExplorerStore } from "./explorer-store";

// Shared by the account-page header (shown on the saved/route/history tabs,
// where ProfileTab itself isn't mounted) and ProfileTab's own hero avatar —
// both let the user change their avatar, so this reads/writes the store
// directly rather than being duplicated in both places.
export function useAvatarPicker() {
  const hydrateAuth = useExplorerStore((state) => state.hydrateAuth);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  async function handleSelectAvatar(avatarId: AvatarId) {
    const res = await apiFetch("/api/me/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId })
    });

    if (res.ok) {
      const data = (await res.json()) as { user: User };
      hydrateAuth(data.user);
      setIsAvatarPickerOpen(false);
    }
  }

  return { isAvatarPickerOpen, setIsAvatarPickerOpen, handleSelectAvatar };
}
