"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Language } from "@/shared/i18n/types";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { FlagIcon } from "@/shared/ui/flag-icon";
import { cn } from "@/shared/lib/cn";

const languageOptions: Array<{ language: Language; label: string }> = [
  { language: "en", label: "English" },
  { language: "ru", label: "Русский" },
  { language: "ja", label: "日本語" }
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const language = useExplorerStore((state) => state.language);
  const setLanguage = useExplorerStore((state) => state.setLanguage);
  const t = getTranslations(language);
  const [isOpen, setIsOpen] = useState(false);

  const current = languageOptions.find((option) => option.language === language) ?? languageOptions[0];

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label={t.app.language}
        className="flex h-9 items-center gap-1 rounded-md border border-border bg-muted/60 px-2 text-xs font-semibold text-foreground transition hover:bg-muted sm:gap-1.5 sm:px-2.5"
      >
        <FlagIcon language={current.language} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-lg border border-border bg-white p-1.5 shadow-panel">
            {languageOptions.map((option) => (
              <button
                key={option.language}
                type="button"
                onClick={() => {
                  setLanguage(option.language);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                <FlagIcon language={option.language} />
                {option.label}
                {option.language === language && <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
