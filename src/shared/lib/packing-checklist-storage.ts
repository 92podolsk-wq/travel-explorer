export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklistState = {
  tripName: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  packingItems: ChecklistItem[];
  documentItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
  departureItems: ChecklistItem[];
};

const STORAGE_KEY = "travel-explorer-packing-checklist";

const defaultPackingLabels = [
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

const defaultDocumentLabels = ["Паспорт / документы", "Билеты и бронирования", "Деньги и карты"];

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function itemsFrom(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({ id: makeId(), label, checked: false }));
}

function defaultState(): PackingChecklistState {
  return {
    tripName: null,
    tripStartDate: null,
    tripEndDate: null,
    packingItems: itemsFrom(defaultPackingLabels),
    documentItems: itemsFrom(defaultDocumentLabels),
    shoppingItems: [],
    departureItems: []
  };
}

// Existing browsers may still have the pre-redesign shape saved
// (`tripDate`, no document/departure arrays) — backfill it on read instead
// of discarding the user's saved items.
type LegacyPackingChecklistState = {
  tripDate?: string | null;
  packingItems?: ChecklistItem[];
  shoppingItems?: ChecklistItem[];
};

function migrateState(raw: PackingChecklistState & LegacyPackingChecklistState): PackingChecklistState {
  return {
    tripName: raw.tripName ?? null,
    tripStartDate: raw.tripStartDate ?? raw.tripDate ?? null,
    tripEndDate: raw.tripEndDate ?? null,
    packingItems: raw.packingItems ?? [],
    documentItems: raw.documentItems ?? [],
    shoppingItems: raw.shoppingItems ?? [],
    departureItems: raw.departureItems ?? []
  };
}

export function readChecklistState(): PackingChecklistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function writeChecklistState(state: PackingChecklistState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures (e.g. private browsing)
  }
}
