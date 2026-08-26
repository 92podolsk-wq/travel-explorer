import type { ChecklistCategory, ChecklistItem, PackingChecklist } from "@/entities/checklist/model/types";
import { prisma } from "./prisma-client";

const DEFAULT_PACKING_LABELS = [
  "Зарядка и переходник",
  "Power bank",
  "Лекарства",
  "Зубная щётка и паста",
  "Туалетные принадлежности",
  "Смена одежды",
  "Наушники",
  "Солнцезащитные очки",
  "Бытовая аптечка"
];

const DEFAULT_DOCUMENT_LABELS = ["Паспорт / документы", "Билеты и бронирования", "Деньги и карты"];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function itemsFrom(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({ id: makeId(), label, checked: false }));
}

function defaultCategories(): ChecklistCategory[] {
  return [
    { id: "packing", title: "Взять с собой", emoji: "🧳", items: itemsFrom(DEFAULT_PACKING_LABELS) },
    { id: "documents", title: "Документы", emoji: "📄", items: itemsFrom(DEFAULT_DOCUMENT_LABELS) }
  ];
}

export function toChecklist(row: {
  tripName: string | null;
  tripStartDate: Date | null;
  tripEndDate: Date | null;
  categories: unknown;
}): PackingChecklist {
  return {
    tripName: row.tripName,
    tripStartDate: row.tripStartDate ? row.tripStartDate.toISOString() : null,
    tripEndDate: row.tripEndDate ? row.tripEndDate.toISOString() : null,
    categories: row.categories as ChecklistCategory[]
  };
}

export async function getOrCreateChecklist(userId: string): Promise<PackingChecklist> {
  const row = await prisma.packingChecklist.upsert({
    where: { userId },
    update: {},
    create: { userId, categories: defaultCategories() }
  });
  return toChecklist(row);
}

export async function updateChecklist(
  userId: string,
  patch: Partial<PackingChecklist>
): Promise<PackingChecklist> {
  const tripStartDate =
    patch.tripStartDate === undefined ? undefined : patch.tripStartDate ? new Date(patch.tripStartDate) : null;
  const tripEndDate = patch.tripEndDate === undefined ? undefined : patch.tripEndDate ? new Date(patch.tripEndDate) : null;

  const row = await prisma.packingChecklist.upsert({
    where: { userId },
    update: {
      tripName: patch.tripName,
      tripStartDate,
      tripEndDate,
      categories: patch.categories
    },
    create: {
      userId,
      tripName: patch.tripName ?? null,
      tripStartDate: tripStartDate ?? null,
      tripEndDate: tripEndDate ?? null,
      categories: patch.categories ?? defaultCategories()
    }
  });
  return toChecklist(row);
}

export async function getChecklistForOwner(ownerId: string): Promise<PackingChecklist | null> {
  const row = await prisma.packingChecklist.findUnique({ where: { userId: ownerId } });
  return row ? toChecklist(row) : null;
}
