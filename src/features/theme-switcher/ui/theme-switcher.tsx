"use client";

import { useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import type { Theme } from "@/shared/lib/theme";
import { getTranslations } from "@/shared/i18n/translations";
import { useExplorerStore } from "@/shared/model/explorer-store";
import { cn } from "@/shared/lib/cn";

export function ThemeSwitcher({ className }: { className?: string }) {
  const language = useExplorerStore((state) => state.language);
  const theme = useExplorerStore((state) => state.theme);
  const setTheme = useExplorerStore((state) => state.setTheme);
  const t = getTranslations(language).app;
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: "light", label: t.themeLight, icon: Sun },
    { value: "dark", label: t.themeDark, icon: Moon },
    { value: "system", label: t.themeSystem, icon: Monitor }
  ];

  const current = themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const CurrentIcon = current.icon;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-label={t.theme}
        className="flex h-9 items-center gap-1 rounded-md border border-border bg-muted/60 px-2 text-xs font-semibold text-foreground transition hover:bg-muted sm:gap-1.5 sm:px-2.5"
      >
        <CurrentIcon className="h-3.5 w-3.5" aria-hidden="true" />
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
          <div className="absolute right-0 top-full z-40 mt-2 w-40 rounded-lg border border-border bg-card p-1.5 shadow-panel">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm font-medium text-foreground transition hover:bg-muted/60"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {option.label}
                  {option.value === theme && <Check className="ml-auto h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
