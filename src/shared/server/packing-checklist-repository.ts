import type { ChecklistItem, PackingChecklist } from "@/entities/checklist/model/types";
import { prisma } from "./prisma-client";

const DEFAULT_PACKING_LABELS = [
  "Паспорт / документы",
  "Билеты и бронирования",
  "Деньги и карты",
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

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultPackingItems(): ChecklistItem[] {
  return DEFAULT_PACKING_LABELS.map((label) => ({ id: makeId(), label, checked: false }));
}

function toChecklist(row: { tripDate: Date | null; packingItems: unknown; shoppingItems: unknown }): PackingChecklist {
  return {
    tripDate: row.tripDate ? row.tripDate.toISOString() : null,
    packingItems: row.packingItems as ChecklistItem[],
    shoppingItems: row.shoppingItems as ChecklistItem[]
  };
}

export async function getOrCreateChecklist(userId: string): Promise<PackingChecklist> {
  const row = await prisma.packingChecklist.upsert({
    where: { userId },
    update: {},
    create: { userId, packingItems: defaultPackingItems(), shoppingItems: [] }
  });
  return toChecklist(row);
}

export async function updateChecklist(
  userId: string,
  patch: Partial<PackingChecklist>
): Promise<PackingChecklist> {
  const tripDate = patch.tripDate === undefined ? undefined : patch.tripDate ? new Date(patch.tripDate) : null;

  const row = await prisma.packingChecklist.upsert({
    where: { userId },
    update: { tripDate, packingItems: patch.packingItems, shoppingItems: patch.shoppingItems },
    create: {
      userId,
      tripDate: tripDate ?? null,
      packingItems: patch.packingItems ?? defaultPackingItems(),
      shoppingItems: patch.shoppingItems ?? []
    }
  });
  return toChecklist(row);
}

export async function getChecklistForOwner(ownerId: string): Promise<PackingChecklist | null> {
  const row = await prisma.packingChecklist.findUnique({ where: { userId: ownerId } });
  return row ? toChecklist(row) : null;
}
