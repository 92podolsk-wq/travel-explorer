CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameByLanguage" JSONB NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN "canAccessHiddenCategories" BOOLEAN NOT NULL DEFAULT false;
