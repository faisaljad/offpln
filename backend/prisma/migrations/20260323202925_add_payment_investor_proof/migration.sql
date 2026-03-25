-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'UNDER_REVIEW';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "investorProofUrl" TEXT;
