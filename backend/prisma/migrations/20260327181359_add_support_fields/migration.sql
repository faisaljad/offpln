-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "supportAddress" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportPhone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportWebsite" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportWhatsapp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supportWorkingHours" TEXT NOT NULL DEFAULT '';
