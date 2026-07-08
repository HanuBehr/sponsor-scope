-- AlterEnum
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'TWITCH_PANEL';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'CHAT_COMMAND';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'YOUTUBE_DESCRIPTION';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'DISCORD_POST';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'TWITTER_X_POST';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'LINKTREE_BEACONS';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'STREAM_OVERLAY';
ALTER TYPE "SponsorSignalSourceType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "SponsorSignal" ADD COLUMN "manualSourceUrl" TEXT,
ADD COLUMN "manualPeerChannel" TEXT,
ADD COLUMN "manualSeenViewers" INTEGER,
ADD COLUMN "manualGameCategory" TEXT;
