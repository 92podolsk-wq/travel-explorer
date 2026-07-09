-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "Poi" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';
