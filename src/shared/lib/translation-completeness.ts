const CYRILLIC = /[Ѐ-ӿ]/;
const JAPANESE = /[぀-ヿ一-鿿]/;

export type CheckedLanguage = "en" | "ja";

export function looksTranslated(lang: CheckedLanguage, text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return lang === "ja" ? JAPANESE.test(trimmed) : !CYRILLIC.test(trimmed);
}

export function missingLanguages(fields: Record<string, string>[]): CheckedLanguage[] {
  const missingEn = fields.some((field) => !looksTranslated("en", field.en ?? ""));
  const missingJa = fields.some((field) => !looksTranslated("ja", field.ja ?? ""));
  return [...(missingEn ? (["en"] as const) : []), ...(missingJa ? (["ja"] as const) : [])];
}
