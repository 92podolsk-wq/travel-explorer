import { describe, expect, it } from "vitest";
import { looksTranslated, localizedPoiDescription, missingLanguages } from "./translation-completeness";

describe("looksTranslated", () => {
  it("treats empty or whitespace-only text as not translated", () => {
    expect(looksTranslated("en", "")).toBe(false);
    expect(looksTranslated("en", "   ")).toBe(false);
  });

  it("rejects English text that still contains Cyrillic", () => {
    expect(looksTranslated("en", "Осака Castle")).toBe(false);
  });

  it("accepts English text with no Cyrillic", () => {
    expect(looksTranslated("en", "Osaka Castle")).toBe(true);
  });

  it("requires Japanese script for the ja language", () => {
    expect(looksTranslated("ja", "Osaka Castle")).toBe(false);
    expect(looksTranslated("ja", "大阪城")).toBe(true);
  });
});

describe("localizedPoiDescription", () => {
  const base = { ru: "Осакский замок", en: "", ja: "" };

  it("always trusts the Russian field", () => {
    expect(localizedPoiDescription(base, "fallback", "ru")).toBe("Осакский замок");
  });

  it("uses the localized field when it looks translated", () => {
    const fields = { ...base, en: "Osaka Castle" };
    expect(localizedPoiDescription(fields, "fallback", "en")).toBe("Osaka Castle");
  });

  it("falls back to the dictionary description when the localized field still looks untranslated", () => {
    const fields = { ...base, en: "Осакский замок" };
    expect(localizedPoiDescription(fields, "fallback", "en", "dictionary version")).toBe("dictionary version");
  });

  it("falls back to the raw description when there is no dictionary entry", () => {
    const fields = { ...base, en: "Осакский замок" };
    expect(localizedPoiDescription(fields, "fallback", "en")).toBe("fallback");
  });
});

describe("missingLanguages", () => {
  it("reports no missing languages when every field is translated", () => {
    expect(missingLanguages([{ en: "Osaka Castle", ja: "大阪城" }])).toEqual([]);
  });

  it("reports en when any field's English still contains Cyrillic", () => {
    expect(missingLanguages([{ en: "Osaka Castle", ja: "大阪城" }, { en: "Замок", ja: "城" }])).toEqual(["en"]);
  });

  it("reports both languages when both are missing across the field set", () => {
    expect(missingLanguages([{ en: "Замок", ja: "" }])).toEqual(["en", "ja"]);
  });
});
