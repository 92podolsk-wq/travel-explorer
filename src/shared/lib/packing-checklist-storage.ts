export type ChecklistItem = { id: string; label: string; checked: boolean };

export type ChecklistCategory = { id: string; title: string; emoji: string; items: ChecklistItem[] };

export type PackingChecklistState = {
  tripName: string | null;
  tripStartDate: string | null;
  tripEndDate: string | null;
  categories: ChecklistCategory[];
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

function defaultCategories(): ChecklistCategory[] {
  return [
    { id: "packing", title: "Взять с собой", emoji: "🧳", items: itemsFrom(defaultPackingLabels) },
    { id: "documents", title: "Документы", emoji: "📄", items: itemsFrom(defaultDocumentLabels) }
  ];
}

function defaultState(): PackingChecklistState {
  return {
    tripName: null,
    tripStartDate: null,
    tripEndDate: null,
    categories: defaultCategories()
  };
}

// Existing browsers may still have an older shape saved — either the
// pre-redesign shape (`tripDate`, no document/departure arrays) or the
// pre-categories shape (4 fixed item arrays instead of `categories`).
// Backfill both on read instead of discarding the user's saved items.
type LegacyPackingChecklistState = {
  tripDate?: string | null;
  packingItems?: ChecklistItem[];
  documentItems?: ChecklistItem[];
  shoppingItems?: ChecklistItem[];
  departureItems?: ChecklistItem[];
};

function migrateState(
  raw: Partial<PackingChecklistState> & LegacyPackingChecklistState
): PackingChecklistState {
  const categories =
    raw.categories ??
    [
      { id: "packing", title: "Взять с собой", emoji: "🧳", items: raw.packingItems ?? [] },
      { id: "documents", title: "Документы", emoji: "📄", items: raw.documentItems ?? [] },
      { id: "shopping", title: "Купить", emoji: "🛍", items: raw.shoppingItems ?? [] },
      { id: "departure", title: "Перед выездом", emoji: "🏠", items: raw.departureItems ?? [] }
    ];

  return {
    tripName: raw.tripName ?? null,
    tripStartDate: raw.tripStartDate ?? raw.tripDate ?? null,
    tripEndDate: raw.tripEndDate ?? null,
    categories
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
