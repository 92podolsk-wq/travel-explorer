"use client";

import { useState } from "react";
import { getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { Button } from "@/shared/ui/button";

type ReportInaccuracyModalProps = {
  poiId: string;
  language: Language;
  onClose: () => void;
};

export function ReportInaccuracyModal({ poiId, language, onClose }: ReportInaccuracyModalProps) {
  const t = getTranslations(language).report;
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await apiFetch("/api/me/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poiId, message: message.trim() })
      });

      if (!res.ok) {
        setError(t.error);
        return;
      }

      setIsSent(true);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <button type="button" aria-label="Close" className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[24rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-panel">
        {isSent ? (
          <>
            <p className="text-sm text-foreground">{t.thanks}</p>
            <div className="mt-5 flex justify-end">
              <Button type="button" size="sm" onClick={onClose}>
                {t.close}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-3 text-sm font-semibold text-foreground">{t.title}</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              rows={4}
              autoFocus
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/30 focus:ring-2 focus:ring-ring/25"
            />
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={isSending || !message.trim()}>
                {isSending ? t.sending : t.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
