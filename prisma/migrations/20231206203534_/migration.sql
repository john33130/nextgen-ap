/*
  Warnings:

  - You are about to drop the `devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `measurements` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "measurements" DROP CONSTRAINT "measurements_deviceId_fkey";

-- DropTable
DROP TABLE "devices";

-- DropTable
DROP TABLE "measurements";

-- CreateTable
CREATE TABLE "Device" (
    "deviceId" CHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(32) NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🌊',
    "accessKey" TEXT NOT NULL,
    "ownerId" CHAR(8),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "batteryLevel" INTEGER,
    "coordinates" JSONB NOT NULL DEFAULT '{"lat": "", "long": ""}',
    "ph" DECIMAL(65,30),
    "tds" INTEGER,
    "waterTemperature" DECIMAL(65,30),
    "turbidity" INTEGER,
    "risk" "RiskFactor" NOT NULL DEFAULT 'UNKNOWN',

    CONSTRAINT "Device_pkey" PRIMARY KEY ("deviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
