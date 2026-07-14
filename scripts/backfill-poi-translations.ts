import "dotenv/config";
import { prisma } from "../src/shared/server/prisma-client";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

type Lang = "en" | "ru" | "ja";
const ALL_LANGS: Lang[] = ["en", "ru", "ja"];

const CYRILLIC = /[Ѐ-ӿ]/;
const JAPANESE = /[぀-ヿ一-鿿]/;

/** True if `text` is non-empty and its script is consistent with `lang` (i.e. it looks authored in that language, not just copy-pasted from another). */
function looksAuthoredIn(lang: Lang, text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (lang === "ja") return JAPANESE.test(trimmed);
  if (lang === "ru") return CYRILLIC.test(trimmed);
  return !CYRILLIC.test(trimmed) && !JAPANESE.test(trimmed);
}

async function translateOne(text: string, from: Lang, to: Lang): Promise<string> {
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`MyMemory request failed (${res.status})`);
  }
  const data = (await res.json()) as { responseData?: { translatedText?: string } };
  return data.responseData?.translatedText?.trim() || text;
}

type LocalizedFields = Partial<Record<Lang, string>>;

type Fix = {
  poiId: string;
  field: "name" | "description";
  current: LocalizedFields;
  source: Lang;
  sourceText: string;
  needs: Lang[];
};

function planFix(poiId: string, field: "name" | "description", byLang: LocalizedFields, fallback: string): Fix | null {
  const values: LocalizedFields = { ...byLang };
  if (!values.en && !values.ru && !values.ja) {
    values.en = fallback;
  }

  // Prefer whichever language slot actually looks authored, in en -> ru -> ja priority.
  const source = ALL_LANGS.find((lang) => looksAuthoredIn(lang, values[lang] ?? ""));
  if (!source) return null;

  const needs = ALL_LANGS.filter((lang) => lang !== source && !looksAuthoredIn(lang, values[lang] ?? ""));
  if (needs.length === 0) return null;

  return { poiId, field, current: values, source, sourceText: values[source]!.trim(), needs };
}

async function main() {
  const apply = process.argv.includes("--apply");

  const rows = await prisma.poi.findMany({
    select: { id: true, name: true, nameByLanguage: true, description: true, descriptionByLanguage: true }
  });

  const fixes: Fix[] = [];

  for (const row of rows) {
    const nameFix = planFix(row.id, "name", (row.nameByLanguage as LocalizedFields | null) ?? {}, row.name);
    if (nameFix) fixes.push(nameFix);

    const descFix = planFix(
      row.id,
      "description",
      (row.descriptionByLanguage as LocalizedFields | null) ?? {},
      row.description
    );
    if (descFix) fixes.push(descFix);
  }

  const affectedPois = new Set(fixes.map((fix) => fix.poiId)).size;
  console.log(`Found ${fixes.length} field(s) needing translation across ${affectedPois} POI(s).\n`);

  for (const fix of fixes) {
    console.log(
      `- ${fix.poiId} [${fix.field}] source=${fix.source} needs=${fix.needs.join(", ")} — "${fix.sourceText.slice(0, 70)}"`
    );
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write translations.");
    return;
  }

  for (const fix of fixes) {
    const updated: LocalizedFields = { ...fix.current, [fix.source]: fix.sourceText };
    for (const lang of fix.needs) {
      updated[lang] = await translateOne(fix.sourceText, fix.source, lang);
    }

    if (fix.field === "name") {
      await prisma.poi.update({ where: { id: fix.poiId }, data: { nameByLanguage: updated } });
    } else {
      await prisma.poi.update({ where: { id: fix.poiId }, data: { descriptionByLanguage: updated } });
    }
    console.log(`Updated ${fix.poiId} [${fix.field}]`);
  }

  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
