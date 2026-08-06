export type ChecklistItem = { id: string; label: string; checked: boolean };

export type PackingChecklistState = {
  tripDate: string | null;
  packingItems: ChecklistItem[];
  shoppingItems: ChecklistItem[];
};

const STORAGE_KEY = "travel-explorer-packing-checklist";

const defaultPackingLabels = [
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

function defaultState(): PackingChecklistState {
  return {
    tripDate: null,
    packingItems: defaultPackingLabels.map((label) => ({ id: makeId(), label, checked: false })),
    shoppingItems: []
  };
}

export function readChecklistState(): PackingChecklistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return JSON.parse(raw) as PackingChecklistState;
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
