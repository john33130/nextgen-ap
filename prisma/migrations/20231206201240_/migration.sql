/*
  Warnings:

  - You are about to drop the `Device` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_ownerId_fkey";

-- DropTable
DROP TABLE "Device";

-- CreateTable
CREATE TABLE "devices" (
    "deviceId" CHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(32) NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌊',
    "accessKey" TEXT NOT NULL,
    "ownerId" CHAR(8),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batteryLevel" INTEGER,
    "coordinates" JSONB NOT NULL DEFAULT '{"lat": "", "long": ""}',

    CONSTRAINT "devices_pkey" PRIMARY KEY ("deviceId")
);

-- CreateTable
CREATE TABLE "measurements" (
    "deviceId" CHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ph" DECIMAL(65,30),
    "tds" INTEGER,
    "waterTemperature" DECIMAL(65,30),
    "turbidity" INTEGER,
    "risk" "RiskFactor" NOT NULL DEFAULT 'UNKNOWN',

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("deviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "devices_deviceId_key" ON "devices"("deviceId");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("deviceId") ON DELETE RESTRICT ON UPDATE CASCADE;
