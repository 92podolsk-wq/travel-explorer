import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/shared/server/admin-auth";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";
const TARGET_LANGUAGES = ["en"] as const;
type TargetLanguage = (typeof TARGET_LANGUAGES)[number];

async function translateOne(text: string, target: TargetLanguage): Promise<string> {
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=ru|${target}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("MyMemory request failed");
  }

  const data = (await res.json()) as { responseData?: { translatedText?: string } };
  return data.responseData?.translatedText?.trim() || text;
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    items?: { key: string; text: string }[];
    targets?: TargetLanguage[];
  };

  const items = body.items?.filter((item) => item.key && item.text.trim()) ?? [];
  const targets = body.targets?.filter((target) => TARGET_LANGUAGES.includes(target)) ?? [];

  if (items.length === 0 || targets.length === 0) {
    return NextResponse.json({ error: "Nothing to translate" }, { status: 400 });
  }

  const translations: Record<string, Partial<Record<TargetLanguage, string>>> = {};

  try {
    const jobs = items.flatMap((item) => targets.map((target) => ({ item, target })));
    const results = await Promise.all(
      jobs.map(async ({ item, target }) => ({ key: item.key, target, text: await translateOne(item.text.trim(), target) }))
    );

    for (const result of results) {
      translations[result.key] ??= {};
      translations[result.key][result.target] = result.text;
    }
  } catch {
    return NextResponse.json({ error: "Не удалось перевести текст. Попробуйте позже." }, { status: 502 });
  }

  return NextResponse.json({ translations });
}
