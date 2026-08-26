import { useState } from "react";
import type { AdminUser } from "@/entities/user/model/types";

export function useUsersAdmin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/users");
    if (!res.ok) throw new Error("Failed to load users");
    setUsers((await res.json()) as AdminUser[]);
  }

  async function handleToggleHiddenAccess(user: AdminUser) {
    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canAccessHiddenCategories: !user.canAccessHiddenCategories })
    });

    if (!res.ok) {
      setError("Не удалось изменить доступ к скрытым категориям.");
      return;
    }

    await load();
  }

  async function handleToggleBlock(user: AdminUser) {
    const action = user.isBlocked ? "разблокировать" : "заблокировать";
    if (!window.confirm(`Вы действительно хотите ${action} пользователя «${user.email}»?`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBlocked: !user.isBlocked })
    });

    if (!res.ok) {
      setError("Не удалось изменить статус пользователя.");
      return;
    }

    await load();
  }

  async function handleDelete(user: AdminUser) {
    if (!window.confirm(`Удалить пользователя «${user.email}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });

    if (!res.ok) {
      setError("Не удалось удалить пользователя.");
      return;
    }

    await load();
  }

  return { users, error, load, handleToggleHiddenAccess, handleToggleBlock, handleDelete };
}
