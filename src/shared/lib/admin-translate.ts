export type TargetLanguage = "en" | "ja";

export async function translateFromRussian(
  items: { key: string; text: string }[],
  targets: TargetLanguage[] = ["en", "ja"]
): Promise<Record<string, Partial<Record<TargetLanguage, string>>>> {
  const res = await fetch("/api/admin/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, targets })
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Не удалось перевести текст.");
  }

  const data = (await res.json()) as { translations: Record<string, Partial<Record<TargetLanguage, string>>> };
  return data.translations;
}
