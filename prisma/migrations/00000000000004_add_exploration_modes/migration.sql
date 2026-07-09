-- CreateTable
CREATE TABLE "ExplorationMode" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameByLanguage" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionByLanguage" JSONB NOT NULL,
    "tags" TEXT[],
    "icon" TEXT NOT NULL,

    CONSTRAINT "ExplorationMode_pkey" PRIMARY KEY ("id")
);
