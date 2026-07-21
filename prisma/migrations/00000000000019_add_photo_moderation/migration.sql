-- AlterTable: Photo moderation fields (id's @default(cuid()) needs no SQL — client-side default only)
ALTER TABLE "Photo" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE "Photo" ADD COLUMN "uploadedByUserId" TEXT;
ALTER TABLE "Photo" ADD COLUMN "storagePath" TEXT;
ALTER TABLE "Photo" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Photo_status_idx" ON "Photo"("status");

-- CreateIndex
CREATE INDEX "Photo_uploadedByUserId_idx" ON "Photo"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: daily photo-upload limits
ALTER TABLE "SiteSetting" ADD COLUMN "maxPhotoUploadsPerUserPerDay" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "SiteSetting" ADD COLUMN "maxPhotoUploadsSiteWidePerDay" INTEGER NOT NULL DEFAULT 200;
