-- Stable ingestion keys and export batch markers for retry-safe V1 operations.
ALTER TABLE "SponsorSignal" ADD COLUMN "sourceKey" TEXT;
ALTER TABLE "SponsorLead" ADD COLUMN "exportBatchKey" TEXT;
ALTER TABLE "ExportLog" ADD COLUMN "exportBatchKey" TEXT;

CREATE UNIQUE INDEX "StreamSnapshot_discoveryRunId_twitchStreamId_key" ON "StreamSnapshot"("discoveryRunId", "twitchStreamId");
CREATE UNIQUE INDEX "SponsorSignal_campaignId_sourceType_sourceKey_key" ON "SponsorSignal"("campaignId", "sourceType", "sourceKey");
CREATE INDEX "ExportLog_campaignId_exportBatchKey_idx" ON "ExportLog"("campaignId", "exportBatchKey");
