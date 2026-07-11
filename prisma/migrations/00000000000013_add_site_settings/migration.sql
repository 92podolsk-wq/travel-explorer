-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mapStyleId" TEXT NOT NULL DEFAULT 'openfreemap-bright',
    "protomapsPmtilesUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
