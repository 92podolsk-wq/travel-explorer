"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/shared/ui/button";

type BroadcastResult = { sent: number; failed: number; totalTokens: number };

export function PushNotificationsTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/push/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось отправить рассылку");
        return;
      }
      setResult(data as BroadcastResult);
      setTitle("");
      setBody("");
    } catch {
      setError("Не удалось отправить рассылку");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border bg-white p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Push-рассылка</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Сообщение придёт всем, у кого установлено Android-приложение и включены уведомления.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Заголовок</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Новое место в Осаке!"
          className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Текст сообщения</label>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Загляните на карту — добавили новые точки"
          className="resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={() => void handleSend()}
          disabled={isSending || !title.trim() || !body.trim()}
        >
          <Send className="h-4 w-4" />
          {isSending ? "Отправка…" : "Отправить всем"}
        </Button>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {result && (
        <p className="text-sm text-muted-foreground">
          Отправлено: {result.sent} · Ошибок: {result.failed} · Всего устройств: {result.totalTokens}
        </p>
      )}
    </div>
  );
}
