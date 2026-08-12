-- AlterTable
ALTER TABLE "User" ADD COLUMN     "username" TEXT;

-- Backfill existing users with a username derived from their email, using
-- the (globally unique) cuid id as a suffix to guarantee uniqueness even if
-- two emails share the same local part.
UPDATE "User"
SET "username" = lower(regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_]', '', 'g')) || '_' || right("id", 8)
WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
