"use client";

import { useState } from "react";
import type { AdminAccount } from "@/entities/admin-account/model/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type FormState = {
  name: string;
  email: string;
  password: string;
};

function toFormState(account: AdminAccount | undefined): FormState {
  if (!account) {
    return { name: "", email: "", password: "" };
  }

  return { name: account.name, email: account.email, password: "" };
}

const fieldLabel = "mb-1.5 block cursor-help text-xs font-semibold uppercase tracking-wide text-muted-foreground";

type AdminAccountFormProps = {
  account?: AdminAccount;
  onCancel: () => void;
  onSubmit: (input: { name: string; email: string; password: string }) => Promise<void> | void;
};

export function AdminAccountForm({ account, onCancel, onSubmit }: AdminAccountFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(account));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) return setError("Укажите имя.");
    if (!form.email.trim()) return setError("Укажите email.");
    if (!account && (!form.password || form.password.length < 8)) {
      return setError("Укажите пароль (не менее 8 символов).");
    }
    if (form.password && form.password.length < 8) {
      return setError("Пароль должен быть не менее 8 символов.");
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ name: form.name.trim(), email: form.email.trim(), password: form.password });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={fieldLabel} title="Имя администратора — показывается в шапке админ-панели после входа.">
            Имя
          </label>
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Иван Иванов" />
        </div>
        <div>
          <label className={fieldLabel} title="Email используется для входа в админ-панель.">
            Email
          </label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="admin@example.com"
          />
        </div>
      </div>

      <div>
        <label
          className={fieldLabel}
          title={account ? "Оставьте пустым, чтобы не менять пароль." : "Пароль для входа — не менее 8 символов."}
        >
          {account ? "Новый пароль (необязательно)" : "Пароль"}
        </label>
        <Input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder={account ? "Оставьте пустым, чтобы не менять" : "Не менее 8 символов"}
        />
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
