-- AlterTable
ALTER TABLE "SponsorSignal" ADD COLUMN "matchedKeywords" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
