-- AlterTable
ALTER TABLE "Poi" ADD COLUMN "isTemporarilyClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "closedStatusCheckedAt" TIMESTAMP(3);
