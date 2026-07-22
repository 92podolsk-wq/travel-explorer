import type { Language } from "@/shared/i18n/types";

const CYRILLIC = /[Ѐ-ӿ]/;
const JAPANESE = /[぀-ヿ一-鿿]/;

export type CheckedLanguage = "en" | "ja";

export function looksTranslated(lang: CheckedLanguage, text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return lang === "ja" ? JAPANESE.test(trimmed) : !CYRILLIC.test(trimmed);
}

/**
 * Picks the description to show for a POI in the given language: trusts descriptionByLanguage
 * for Russian (the source language) or when it looks genuinely translated, otherwise falls back
 * to a hand-curated dictionary description (if any) or the raw description field, since
 * auto-translation can occasionally fail and return untranslated/empty text.
 */
export function localizedPoiDescription(
  descriptionByLanguage: Record<Language, string>,
  fallbackDescription: string,
  language: Language,
  dictionaryDescription?: string
): string {
  const localized = descriptionByLanguage[language];
  if (language === "ru") return localized;
  return looksTranslated(language, localized) ? localized : (dictionaryDescription ?? fallbackDescription);
}

/**
 * Same fallback logic as localizedPoiDescription, but for the bestTime string list: trusts
 * bestTimeByLanguage for Russian or when it looks genuinely translated, otherwise falls back to a
 * hand-curated dictionary list (if any) or the raw bestTime field.
 */
export function localizedPoiBestTime(
  bestTimeByLanguage: Record<Language, string[]>,
  fallbackBestTime: string[],
  language: Language,
  dictionaryBestTime?: string[]
): string[] {
  const localized = bestTimeByLanguage[language];
  if (language === "ru") return localized;
  return looksTranslated(language, localized.join(", ")) ? localized : (dictionaryBestTime ?? fallbackBestTime);
}

export function missingLanguages(fields: Record<string, string>[]): CheckedLanguage[] {
  const missingEn = fields.some((field) => !looksTranslated("en", field.en ?? ""));
  const missingJa = fields.some((field) => !looksTranslated("ja", field.ja ?? ""));
  return [...(missingEn ? (["en"] as const) : []), ...(missingJa ? (["ja"] as const) : [])];
}
