-- AlterTable
ALTER TABLE "SponsorLead" ADD COLUMN "sponsorCategory" TEXT,
ADD COLUMN "sponsorshipType" TEXT,
ADD COLUMN "sponsorContact" TEXT,
ADD COLUMN "outreachStatus" TEXT NOT NULL DEFAULT 'Not Contacted',
ADD COLUMN "exportedAt" TIMESTAMP(3),
ADD COLUMN "exportedTab" TEXT,
ADD COLUMN "googleSheetId" TEXT,
ADD COLUMN "googleSheetRange" TEXT;

-- AlterTable
ALTER TABLE "ExportLog" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "errorMessage" TEXT;
