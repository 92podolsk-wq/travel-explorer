-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN "maxCustomMarkersPerUser" INTEGER NOT NULL DEFAULT 200;

-- CreateTable
CREATE TABLE "CustomMarker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomMarker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomMarker_userId_idx" ON "CustomMarker"("userId");

-- AddForeignKey
ALTER TABLE "CustomMarker" ADD CONSTRAINT "CustomMarker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
