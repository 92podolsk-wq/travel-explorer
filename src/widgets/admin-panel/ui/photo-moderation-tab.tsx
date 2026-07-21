"use client";

import { useState } from "react";
import { Check, Trash2 } from "lucide-react";
import type { AdminPhoto } from "@/entities/photo/model/types";

type PhotoModerationTabProps = {
  photos: AdminPhoto[];
  onReload: () => void;
};

export function PhotoModerationTab({ photos, onReload }: PhotoModerationTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleApprove = async (photo: AdminPhoto) => {
    setError(null);
    setPendingId(photo.id);
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}/approve`, { method: "POST" });
      if (!res.ok) {
        setError("Не удалось одобрить фото.");
        return;
      }
      onReload();
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (photo: AdminPhoto) => {
    if (!window.confirm("Удалить это фото?")) return;

    setError(null);
    setPendingId(photo.id);
    try {
      const res = await fetch(`/api/admin/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Не удалось удалить фото.");
        return;
      }
      onReload();
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      {error && <p className="mb-4 text-sm font-medium text-red-600">{error}</p>}

      {photos.length === 0 ? (
        <p className="rounded-lg border border-border bg-white p-6 text-center text-sm text-muted-foreground shadow-sm">
          Фото на модерации нет
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/photos/${photo.id}/preview`}
                alt={photo.alt}
                className="h-48 w-full object-cover"
              />
              <div className="space-y-1 p-3">
                <p className="text-sm font-semibold text-foreground">{photo.poiName}</p>
                <p className="text-xs text-muted-foreground">
                  {photo.uploadedByName ? `${photo.uploadedByName} · ` : ""}
                  {photo.uploadedByEmail ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(photo.createdAt).toLocaleString("ru-RU")}
                </p>
                <div className="flex items-center gap-3 pt-1.5">
                  <button
                    type="button"
                    onClick={() => handleApprove(photo)}
                    disabled={pendingId === photo.id}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition hover:underline disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Одобрить
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo)}
                    disabled={pendingId === photo.id}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 transition hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
