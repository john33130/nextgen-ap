-- CreateEnum
CREATE TYPE "RiskFactor" AS ENUM ('HIGH', 'MODERATE', 'LOW', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "userId" CHAR(8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(64) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "deactivated" BOOLEAN NOT NULL DEFAULT false,
    "deactivationDate" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("userId")
);

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
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Device_deviceId_key" ON "Device"("deviceId");

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
