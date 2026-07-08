import { google } from "googleapis";
import { SponsorLeadStatus } from "@prisma/client";
import { getGoogleSheetsEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const SHEET_TABS = ["ROBLOX", "General Gaming", "Gambling"] as const;
type SheetTabName = (typeof SHEET_TABS)[number];

type LeadForExport = Awaited<ReturnType<typeof loadUnexportedLeads>>[number];

export async function getGoogleSheetsClient() {
  const sheetsEnv = getGoogleSheetsEnv();
  const auth = new google.auth.JWT({
    email: sheetsEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: sheetsEnv.GOOGLE_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

export function formatSponsorLeadExportRow(lead: LeadForExport, latestViewerCount?: number | null) {
  const sourceSnapshot = lead.sponsorSignal.streamSnapshot;

  return [
    lead.channel.displayName || twitchChannelUrl(lead.channel.login),
    sourceSnapshot?.viewerCount ?? latestViewerCount ?? "",
    lead.sponsorName,
    lead.sponsorCategory ?? "",
    lead.sponsorshipType ?? "",
    lead.sponsorContact || getSponsorContactFallback(lead.sourceUrl),
    lead.outreachStatus,
    lead.notes ?? "",
  ];
}

export function getLeadExportTabName(lead: LeadForExport): SheetTabName {
  const sourceContext = [lead.sponsorSignal.streamSnapshot?.gameName, ...lead.campaign.categories.map((category) => category.name)].filter(Boolean).join(" ").toLowerCase();

  if (sourceContext.includes("roblox")) {
    return "ROBLOX";
  }

  if (["slots", "casino", "gambling", "betting", "poker", "sports betting"].some((term) => sourceContext.includes(term))) {
    return "Gambling";
  }

  return "General Gaming";
}

export async function appendLeadRowsToSheet(tabName: SheetTabName, rows: Array<Array<string | number>>) {
  const sheetsEnv = getGoogleSheetsEnv();
  const sheets = await getGoogleSheetsClient();
  const range = `'${tabName}'!B8:I`;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetsEnv.GOOGLE_SHEETS_SPREADSHEET_ID,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows,
    },
  });

  return {
    spreadsheetId: sheetsEnv.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: response.data.updates?.updatedRange ?? range,
  };
}

export async function exportCampaignLeadsToSheets(campaignId: string) {
  const leads = await loadUnexportedLeads(campaignId);
  const latestViewerCounts = await getLatestViewerCounts(campaignId, leads.map((lead) => lead.channelId));
  const groupedLeads = new Map<SheetTabName, LeadForExport[]>();
  let exportedCount = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const tabName = getLeadExportTabName(lead);
    groupedLeads.set(tabName, [...(groupedLeads.get(tabName) ?? []), lead]);
  }

  for (const [tabName, tabLeads] of groupedLeads.entries()) {
    const rows = tabLeads.map((lead) => formatSponsorLeadExportRow(lead, latestViewerCounts.get(lead.channelId)));
    const destination = `Google Sheets:${tabName}`;

    try {
      const appendResult = await appendLeadRowsToSheet(tabName, rows);
      const exportedAt = new Date();

      await prisma.sponsorLead.updateMany({
        where: { id: { in: tabLeads.map((lead) => lead.id) } },
        data: {
          status: SponsorLeadStatus.EXPORTED,
          exportedAt,
          exportedTab: tabName,
          googleSheetId: appendResult.spreadsheetId,
          googleSheetRange: appendResult.range,
        },
      });

      await prisma.exportLog.create({
        data: {
          campaignId,
          destination,
          rowCount: tabLeads.length,
          status: "COMPLETED",
        },
      });

      exportedCount += tabLeads.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Google Sheets append failed";
      errors.push(`${tabName}: ${errorMessage}`);

      await prisma.exportLog.create({
        data: {
          campaignId,
          destination,
          rowCount: 0,
          status: "FAILED",
          errorMessage,
        },
      });
    }
  }

  return {
    exportedCount,
    attemptedCount: leads.length,
    errors,
  };
}

async function loadUnexportedLeads(campaignId: string) {
  return prisma.sponsorLead.findMany({
    where: {
      campaignId,
      status: SponsorLeadStatus.CONFIRMED,
      exportedAt: null,
    },
    orderBy: { confirmedAt: "asc" },
    include: {
      campaign: { include: { categories: true } },
      channel: true,
      sponsorSignal: {
        include: {
          streamSnapshot: true,
          vod: true,
        },
      },
    },
  });
}

async function getLatestViewerCounts(campaignId: string, channelIds: string[]) {
  const counts = new Map<string, number>();

  for (const channelId of [...new Set(channelIds)]) {
    const latestSnapshot = await prisma.streamSnapshot.findFirst({
      where: {
        channelId,
        discoveryRun: { campaignId },
      },
      orderBy: { capturedAt: "desc" },
      select: { viewerCount: true },
    });

    if (latestSnapshot) {
      counts.set(channelId, latestSnapshot.viewerCount);
    }
  }

  return counts;
}

function twitchChannelUrl(login: string) {
  return login ? `https://www.twitch.tv/${login}` : "";
}

function getSponsorContactFallback(sourceUrl: string | null) {
  if (!sourceUrl) {
    return "";
  }

  try {
    const host = new URL(sourceUrl).hostname.toLowerCase();
    return host.includes("twitch.tv") ? "" : sourceUrl;
  } catch {
    return "";
  }
}
