import type { Language } from "@/shared/i18n/types";
import { cn } from "@/shared/lib/cn";

type FlagIconProps = {
  language: Language;
  className?: string;
};

const flagMarkup: Record<Language, React.ReactNode> = {
  en: (
    <>
      <rect width="20" height="14" fill="#00247d" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#ffffff" strokeWidth="2.4" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#cf142b" strokeWidth="1.2" />
      <path d="M10,0 V14 M0,7 H20" stroke="#ffffff" strokeWidth="4" />
      <path d="M10,0 V14 M0,7 H20" stroke="#cf142b" strokeWidth="2.4" />
    </>
  ),
  ru: (
    <>
      <rect width="20" height="4.67" y="0" fill="#ffffff" />
      <rect width="20" height="4.67" y="4.67" fill="#0039a6" />
      <rect width="20" height="4.67" y="9.34" fill="#d52b1e" />
    </>
  ),
  ja: (
    <>
      <rect width="20" height="14" fill="#ffffff" />
      <circle cx="10" cy="7" r="4" fill="#bc002d" />
    </>
  )
};

export function FlagIcon({ language, className }: FlagIconProps) {
  return (
    <svg
      viewBox="0 0 20 14"
      aria-hidden="true"
      className={cn("h-2.5 w-3.5 shrink-0 overflow-hidden rounded-[2px]", className)}
    >
      {flagMarkup[language]}
    </svg>
  );
}
