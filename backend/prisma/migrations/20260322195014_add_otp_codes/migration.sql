-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpCode_target_idx" ON "OtpCode"("target");
