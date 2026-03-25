-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID');

-- AlterEnum
ALTER TYPE "PropertyStatus" ADD VALUE 'SOLD';

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profitAmount" DOUBLE PRECISION NOT NULL,
    "totalReturn" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "receiptUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_investmentId_key" ON "Payout"("investmentId");

-- CreateIndex
CREATE INDEX "Payout_propertyId_idx" ON "Payout"("propertyId");

-- CreateIndex
CREATE INDEX "Payout_userId_idx" ON "Payout"("userId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
