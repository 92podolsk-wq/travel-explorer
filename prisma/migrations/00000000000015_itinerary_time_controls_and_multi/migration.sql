-- DropIndex
DROP INDEX "Itinerary_userId_key";

-- CreateIndex
CREATE INDEX "Itinerary_userId_idx" ON "Itinerary"("userId");

-- AlterTable
ALTER TABLE "ItineraryStop" ADD COLUMN "durationOverrideMinutes" INTEGER;

-- AlterTable
ALTER TABLE "ItineraryDay" ADD COLUMN "startMinutes" INTEGER;
ALTER TABLE "ItineraryDay" ADD COLUMN "lunchEnabled" BOOLEAN;
ALTER TABLE "ItineraryDay" ADD COLUMN "lunchStartMinutes" INTEGER;
ALTER TABLE "ItineraryDay" ADD COLUMN "lunchDurationMinutes" INTEGER;
