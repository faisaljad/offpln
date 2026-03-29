-- Add refNumber column
ALTER TABLE "Property" ADD COLUMN "refNumber" TEXT;

-- Fill existing rows with a generated ref number
UPDATE "Property" SET "refNumber" = 'REF-' || SUBSTRING(id, 1, 8) WHERE "refNumber" IS NULL;

-- Make it NOT NULL and UNIQUE
ALTER TABLE "Property" ALTER COLUMN "refNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Property_refNumber_key" ON "Property"("refNumber");
