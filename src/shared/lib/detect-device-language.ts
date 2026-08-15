import type { Language } from "@/shared/i18n/types";

const supportedLanguages: Language[] = ["ru", "en"];

export function detectDeviceLanguage(): Language {
  if (typeof navigator === "undefined") {
    return "ru";
  }

  const candidates = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  for (const candidate of candidates) {
    const code = candidate?.slice(0, 2).toLowerCase();
    if (supportedLanguages.includes(code as Language)) {
      return code as Language;
    }
  }

  return "ru";
}
