-- AlterTable
ALTER TABLE "PackingChecklist"
  ADD COLUMN "tripName" TEXT,
  ADD COLUMN "tripStartDate" TIMESTAMP(3),
  ADD COLUMN "tripEndDate" TIMESTAMP(3),
  ADD COLUMN "documentItems" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "departureItems" JSONB NOT NULL DEFAULT '[]';

-- Carry over existing trip dates before dropping the old column.
UPDATE "PackingChecklist" SET "tripStartDate" = "tripDate";

-- AlterTable
ALTER TABLE "PackingChecklist" DROP COLUMN "tripDate";
