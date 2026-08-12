-- CreateTable
CREATE TABLE "PackingChecklist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tripDate" TIMESTAMP(3),
    "packingItems" JSONB NOT NULL DEFAULT '[]',
    "shoppingItems" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistShare" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryShare" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sharedWithId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackingChecklist_userId_key" ON "PackingChecklist"("userId");

-- CreateIndex
CREATE INDEX "ChecklistShare_sharedWithId_idx" ON "ChecklistShare"("sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "ChecklistShare_ownerId_sharedWithId_key" ON "ChecklistShare"("ownerId", "sharedWithId");

-- CreateIndex
CREATE INDEX "ItineraryShare_sharedWithId_idx" ON "ItineraryShare"("sharedWithId");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryShare_itineraryId_sharedWithId_key" ON "ItineraryShare"("itineraryId", "sharedWithId");

-- AddForeignKey
ALTER TABLE "PackingChecklist" ADD CONSTRAINT "PackingChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistShare" ADD CONSTRAINT "ChecklistShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistShare" ADD CONSTRAINT "ChecklistShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryShare" ADD CONSTRAINT "ItineraryShare_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryShare" ADD CONSTRAINT "ItineraryShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryShare" ADD CONSTRAINT "ItineraryShare_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
