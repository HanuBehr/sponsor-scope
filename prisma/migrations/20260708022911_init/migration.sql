-- CreateEnum
CREATE TYPE "SponsorSignalSourceType" AS ENUM ('STREAM_TITLE', 'VOD_TITLE');

-- CreateEnum
CREATE TYPE "SponsorSignalStatus" AS ENUM ('NEW', 'REVIEWED', 'CONFIRMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SponsorConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DiscoveryRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SponsorLeadStatus" AS ENUM ('CONFIRMED', 'EXPORTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minViewers" INTEGER NOT NULL,
    "maxViewers" INTEGER NOT NULL,
    "languages" TEXT[],
    "sponsorKeywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCategory" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "twitchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "twitchId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamSnapshot" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "discoveryRunId" TEXT,
    "twitchStreamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "viewerCount" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vod" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "twitchVodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "duration" TEXT,
    "viewCount" INTEGER,

    CONSTRAINT "Vod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorSignal" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "streamSnapshotId" TEXT,
    "vodId" TEXT,
    "sourceType" "SponsorSignalSourceType" NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "matchedText" TEXT NOT NULL,
    "sponsorName" TEXT,
    "score" INTEGER NOT NULL,
    "confidence" "SponsorConfidence" NOT NULL,
    "status" "SponsorSignalStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorLead" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "sponsorSignalId" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "status" "SponsorLeadStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryRun" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "status" "DiscoveryRunStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignCategory_campaignId_twitchId_key" ON "CampaignCategory"("campaignId", "twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_twitchId_key" ON "Channel"("twitchId");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_login_key" ON "Channel"("login");

-- CreateIndex
CREATE INDEX "StreamSnapshot_channelId_capturedAt_idx" ON "StreamSnapshot"("channelId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vod_twitchVodId_key" ON "Vod"("twitchVodId");

-- CreateIndex
CREATE INDEX "SponsorSignal_campaignId_status_idx" ON "SponsorSignal"("campaignId", "status");

-- CreateIndex
CREATE INDEX "SponsorSignal_channelId_idx" ON "SponsorSignal"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorLead_sponsorSignalId_key" ON "SponsorLead"("sponsorSignalId");

-- AddForeignKey
ALTER TABLE "CampaignCategory" ADD CONSTRAINT "CampaignCategory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamSnapshot" ADD CONSTRAINT "StreamSnapshot_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamSnapshot" ADD CONSTRAINT "StreamSnapshot_discoveryRunId_fkey" FOREIGN KEY ("discoveryRunId") REFERENCES "DiscoveryRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vod" ADD CONSTRAINT "Vod_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSignal" ADD CONSTRAINT "SponsorSignal_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSignal" ADD CONSTRAINT "SponsorSignal_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSignal" ADD CONSTRAINT "SponsorSignal_streamSnapshotId_fkey" FOREIGN KEY ("streamSnapshotId") REFERENCES "StreamSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSignal" ADD CONSTRAINT "SponsorSignal_vodId_fkey" FOREIGN KEY ("vodId") REFERENCES "Vod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLead" ADD CONSTRAINT "SponsorLead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLead" ADD CONSTRAINT "SponsorLead_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorLead" ADD CONSTRAINT "SponsorLead_sponsorSignalId_fkey" FOREIGN KEY ("sponsorSignalId") REFERENCES "SponsorSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscoveryRun" ADD CONSTRAINT "DiscoveryRun_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
