ALTER TABLE "AppSettings" ADD COLUMN "investmentCommission" JSONB;
ALTER TABLE "AppSettings" ADD COLUMN "soldCommission" JSONB;
ALTER TABLE "AppSettings" ADD COLUMN "transferCommission" JSONB;
ALTER TABLE "AppSettings" ADD COLUMN "paymentDelayFee" JSONB;
ALTER TABLE "AppSettings" ADD COLUMN "paymentDefaultFee" JSONB;
