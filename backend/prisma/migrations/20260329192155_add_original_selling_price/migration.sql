-- Fill existing NULL originalPrice with totalPrice
UPDATE "Property" SET "originalPrice" = "totalPrice" WHERE "originalPrice" IS NULL;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "originalSellingPrice" DOUBLE PRECISION,
ALTER COLUMN "originalPrice" SET NOT NULL,
ALTER COLUMN "originalPrice" SET DEFAULT 0;
