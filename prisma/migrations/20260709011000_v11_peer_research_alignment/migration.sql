-- AlterEnum
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'VOD_DESCRIPTION';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "targetChannelName" TEXT,
ADD COLUMN "targetAvgViewers" INTEGER,
ADD COLUMN "targetNiche" TEXT;

-- AlterTable
ALTER TABLE "Vod" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "SponsorSignal" ADD COLUMN "matchedSponsorTerms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "matchedContextTerms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "DiscoveryRun" ADD COLUMN "streamsFilteredByViewers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "streamsFilteredByLanguage" INTEGER NOT NULL DEFAULT 0;
