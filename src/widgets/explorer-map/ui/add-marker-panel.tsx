"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { customMarkerColors } from "@/entities/custom-marker/model/types";
import { getTranslations } from "@/shared/i18n/translations";
import type { Language } from "@/shared/i18n/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type AddMarkerPanelProps = {
  language: Language;
  markerCount: number;
  markerLimit: number;
  onSave: (color: string, label: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
};

export function AddMarkerPanel({ language, markerCount, markerLimit, onSave, onCancel }: AddMarkerPanelProps) {
  const t = getTranslations(language);
  const [color, setColor] = useState<string>(customMarkerColors[0]);
  const [label, setLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLimitReached = markerCount >= markerLimit;

  async function handleSave() {
    if (isLimitReached) {
      setError(t.app.markerLimitReached.replace("{limit}", String(markerLimit)));
      return;
    }
    setError(null);
    setIsSaving(true);
    const result = await onSave(color, label.trim());
    setIsSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCancel();
  }

  return (
    <div className="absolute bottom-24 left-1/2 z-30 w-[min(360px,calc(100vw-2.5rem))] -translate-x-1/2 rounded-lg border border-border/70 bg-card/[0.96] p-4 shadow-panel backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{t.app.newMarkerTitle}</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t.app.markerCancel}
          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {customMarkerColors.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => setColor(swatch)}
            aria-label={swatch}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition",
              color === swatch ? "border-foreground scale-110" : "border-transparent"
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>

      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={t.app.markerLabelPlaceholder}
        maxLength={60}
        className="mb-3"
      />

      <p className="mb-3 text-xs text-muted-foreground">
        {t.app.markerCountLabel.replace("{count}", String(markerCount)).replace("{limit}", String(markerLimit))}
      </p>

      {error && <p className="mb-3 text-xs font-medium text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          {t.app.markerCancel}
        </Button>
        <Button type="button" size="sm" onClick={() => void handleSave()} disabled={isSaving || isLimitReached}>
          {isSaving ? t.app.markerSaving : t.app.markerSave}
        </Button>
      </div>
    </div>
  );
}
