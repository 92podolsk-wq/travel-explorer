import { useState } from "react";
import type { AdminAccount } from "@/entities/admin-account/model/types";
import type { Selection } from "./types";

export function useAccountsAdmin(setSelection: (selection: Selection) => void) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/accounts");
    if (!res.ok) throw new Error("Failed to load accounts");
    setAccounts((await res.json()) as AdminAccount[]);
  }

  async function handleCreate(input: { name: string; email: string; password: string }) {
    setError(null);
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось создать администратора.");
      return;
    }

    const created = (await res.json()) as AdminAccount;
    await load();
    setSelection({ mode: "edit", id: created.id });
  }

  async function handleUpdate(id: string, input: { name: string; email: string; password: string }) {
    setError(null);
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось сохранить изменения.");
      return;
    }

    await load();
  }

  async function handleDelete(account: AdminAccount) {
    if (!window.confirm(`Удалить администратора «${account.name}»? Это действие нельзя отменить.`)) {
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/accounts/${account.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Не удалось удалить администратора.");
      return;
    }

    setSelection({ mode: "empty" });
    await load();
  }

  return { accounts, error, load, handleCreate, handleUpdate, handleDelete };
}
