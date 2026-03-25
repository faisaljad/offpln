-- CreateEnum
CREATE TYPE "ShareTransferStatus" AS ENUM ('LISTED', 'REQUESTED', 'OTP_PENDING', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateTable
CREATE TABLE "ShareTransfer" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT,
    "askPrice" DOUBLE PRECISION NOT NULL,
    "status" "ShareTransferStatus" NOT NULL DEFAULT 'LISTED',
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareTransfer_investmentId_key" ON "ShareTransfer"("investmentId");

-- CreateIndex
CREATE INDEX "ShareTransfer_sellerId_idx" ON "ShareTransfer"("sellerId");

-- CreateIndex
CREATE INDEX "ShareTransfer_buyerId_idx" ON "ShareTransfer"("buyerId");

-- CreateIndex
CREATE INDEX "ShareTransfer_status_idx" ON "ShareTransfer"("status");

-- AddForeignKey
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "Investment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareTransfer" ADD CONSTRAINT "ShareTransfer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
