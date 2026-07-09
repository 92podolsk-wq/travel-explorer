-- CreateTable
CREATE TABLE "PoiReport" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PoiReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PoiReport" ADD CONSTRAINT "PoiReport_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "Poi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoiReport" ADD CONSTRAINT "PoiReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
