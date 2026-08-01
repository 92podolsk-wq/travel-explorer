"use client";

import { useState } from "react";
import { getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { apiFetch } from "@/shared/lib/api-fetch";
import { Button } from "@/shared/ui/button";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

type UploadPhotoModalProps = {
  poiId: string;
  language: Language;
  onClose: () => void;
};

export function UploadPhotoModal({ poiId, language, onClose }: UploadPhotoModalProps) {
  const t = getTranslations(language).photoUpload;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setError(null);
    if (selected && selected.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setError(t.errorTooLarge);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("poiId", poiId);
      formData.append("file", file);

      const res = await apiFetch("/api/me/poi-photos", { method: "POST", body: formData });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string; limit?: number } | null;
        switch (data?.error) {
          case "FILE_TOO_LARGE":
            setError(t.errorTooLarge);
            break;
          case "INVALID_FILE_TYPE":
            setError(t.errorInvalidType);
            break;
          case "USER_DAILY_LIMIT_REACHED":
            setError(t.errorUserLimit.replace("{limit}", String(data?.limit ?? "")));
            break;
          case "SITE_DAILY_LIMIT_REACHED":
            setError(t.errorSiteLimit);
            break;
          default:
            setError(t.errorGeneric);
        }
        return;
      }

      setIsDone(true);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <button type="button" aria-label="Close" className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[24rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-white p-6 shadow-panel">
        {isDone ? (
          <>
            <p className="text-sm text-foreground">{t.success}</p>
            <div className="mt-5 flex justify-end">
              <Button type="button" size="sm" onClick={onClose}>
                {t.close}
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="mb-1 text-sm font-semibold text-foreground">{t.title}</p>
            <p className="mb-3 text-xs text-muted-foreground">{t.hint}</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-muted/70"
            />
            {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={isUploading || !file}>
                {isUploading ? t.uploading : t.submit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
