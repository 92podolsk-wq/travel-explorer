-- AlterTable: a stop now references either a Poi or a CustomMarker
ALTER TABLE "ItineraryStop" ALTER COLUMN "poiId" DROP NOT NULL;
ALTER TABLE "ItineraryStop" ADD COLUMN "customMarkerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryStop_itineraryId_customMarkerId_key" ON "ItineraryStop"("itineraryId", "customMarkerId");

-- AddForeignKey
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_customMarkerId_fkey" FOREIGN KEY ("customMarkerId") REFERENCES "CustomMarker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint: exactly one of poiId / customMarkerId must be set
ALTER TABLE "ItineraryStop" ADD CONSTRAINT "ItineraryStop_point_check" CHECK (
  ("poiId" IS NOT NULL AND "customMarkerId" IS NULL) OR ("poiId" IS NULL AND "customMarkerId" IS NOT NULL)
);
