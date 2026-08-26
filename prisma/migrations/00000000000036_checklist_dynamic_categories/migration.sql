-- AlterTable
ALTER TABLE "PackingChecklist" ADD COLUMN "categories" JSONB NOT NULL DEFAULT '[]';

-- Fold the 4 fixed columns into the new dynamic category list, lossless —
-- every existing item keeps its id/label/checked, just regrouped under the
-- same 4 categories (by the same titles/emoji) users already see today.
UPDATE "PackingChecklist" SET "categories" = jsonb_build_array(
  jsonb_build_object('id', 'packing', 'title', 'Взять с собой', 'emoji', '🧳', 'items', "packingItems"),
  jsonb_build_object('id', 'documents', 'title', 'Документы', 'emoji', '📄', 'items', "documentItems"),
  jsonb_build_object('id', 'shopping', 'title', 'Купить', 'emoji', '🛍', 'items', "shoppingItems"),
  jsonb_build_object('id', 'departure', 'title', 'Перед выездом', 'emoji', '🏠', 'items', "departureItems")
);

-- AlterTable
ALTER TABLE "PackingChecklist"
  DROP COLUMN "packingItems",
  DROP COLUMN "documentItems",
  DROP COLUMN "shoppingItems",
  DROP COLUMN "departureItems";
