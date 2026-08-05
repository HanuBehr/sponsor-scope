import { DiscoveryRunStatus, SponsorConfidence, SponsorLeadStatus, SponsorSignalSourceType, SponsorSignalStatus } from "@prisma/client";
import { isDemoMode } from "@/lib/env";

const now = new Date("2026-07-12T12:00:00.000Z");

const demoCategory = {
  id: "demo-category-roblox",
  campaignId: "demo-campaign",
  twitchId: "23020",
  name: "Roblox",
  createdAt: now,
};

const demoChannel = {
  id: "demo-channel",
  twitchId: "demo-twitch-channel",
  login: "pixelpilot_demo",
  displayName: "PixelPilot Demo",
  language: "EN",
  createdAt: now,
  updatedAt: now,
};

const demoDiscoveryRun = {
  id: "demo-run",
  campaignId: "demo-campaign",
  status: DiscoveryRunStatus.COMPLETED,
  streamsFound: 42,
  streamsMatched: 9,
  streamsFilteredByViewers: 21,
  streamsFilteredByLanguage: 12,
  vodsFetched: 18,
  startedAt: now,
  completedAt: now,
  errorMessage: null,
  createdAt: now,
};

const demoStreamSnapshot = {
  id: "demo-stream-snapshot",
  channelId: demoChannel.id,
  discoveryRunId: demoDiscoveryRun.id,
  twitchStreamId: "demo-stream-1",
  title: "Roblox obby night sponsored by NeonFuel",
  gameName: "Roblox",
  viewerCount: 184,
  language: "EN",
  capturedAt: now,
  channel: demoChannel,
  discoveryRun: demoDiscoveryRun,
};

const demoVod = {
  id: "demo-vod",
  channelId: demoChannel.id,
  twitchVodId: "demo-vod-1",
  title: "NeonFuel challenge stream with viewers",
  description: "Thanks to NeonFuel for supporting this fictional demo stream.",
  publishedAt: now,
  duration: "2h14m",
  viewCount: 3200,
  channel: demoChannel,
};

const demoSignal = {
  id: "demo-signal",
  campaignId: "demo-campaign",
  channelId: demoChannel.id,
  streamSnapshotId: demoStreamSnapshot.id,
  vodId: null,
  sourceType: SponsorSignalSourceType.STREAM_TITLE,
  sourceTitle: demoStreamSnapshot.title,
  manualSourceUrl: null,
  manualPeerChannel: null,
  manualSeenViewers: null,
  manualGameCategory: null,
  matchedText: demoStreamSnapshot.title,
  matchedKeywords: ["sponsored"],
  matchedSponsorTerms: ["sponsored by"],
  matchedContextTerms: ["Roblox"],
  sourceKey: "STREAM_TITLE:demo-stream-snapshot:roblox obby night sponsored by neonfuel",
  sponsorName: "NeonFuel",
  score: 88,
  confidence: SponsorConfidence.HIGH,
  status: SponsorSignalStatus.CONFIRMED,
  createdAt: now,
  updatedAt: now,
  channel: demoChannel,
  streamSnapshot: demoStreamSnapshot,
  vod: null,
};

const demoLead = {
  id: "demo-lead",
  campaignId: "demo-campaign",
  channelId: demoChannel.id,
  sponsorSignalId: demoSignal.id,
  sponsorName: "NeonFuel",
  sourceUrl: "https://www.twitch.tv/pixelpilot_demo",
  sponsorCategory: "Energy Drink",
  sponsorshipType: "Dedicated Stream",
  sponsorContact: "partnerships@example.invalid",
  outreachStatus: "Not Contacted",
  status: SponsorLeadStatus.CONFIRMED,
  notes: "Fictional demo lead. Replace with reviewed evidence in production.",
  confirmedAt: now,
  exportedAt: null,
  exportedTab: null,
  googleSheetId: null,
  googleSheetRange: null,
  exportBatchKey: null,
  createdAt: now,
  updatedAt: now,
  channel: demoChannel,
  sponsorSignal: demoSignal,
};

export const demoCampaign = {
  id: "demo-campaign",
  name: "Demo Roblox Sponsor Research",
  targetChannelName: "my-demo-channel",
  targetAvgViewers: 120,
  targetNiche: "Roblox variety streams",
  minViewers: 50,
  maxViewers: 300,
  languages: ["EN"],
  sponsorKeywords: ["sponsored", "partner", "thanks to", "code", "ad"],
  createdAt: now,
  updatedAt: now,
  categories: [demoCategory],
  discoveryRuns: [demoDiscoveryRun],
  sponsorSignals: [demoSignal],
  sponsorLeads: [demoLead],
  _count: { sponsorSignals: 1, sponsorLeads: 1, discoveryRuns: 1 },
};

export const demoStreamSnapshots = [demoStreamSnapshot];
export const demoVods = [demoVod];
export const demoExportLogs = [
  {
    id: "demo-export-log",
    campaignId: demoCampaign.id,
    destination: "Google Sheets:ROBLOX",
    rowCount: 1,
    status: "DEMO_ONLY",
    errorMessage: "Demo mode does not write to Google Sheets.",
    exportBatchKey: "demo-export-batch",
    createdAt: now,
  },
];

export function getDemoCampaigns() {
  return isDemoMode ? [demoCampaign] : null;
}

export function getDemoCampaign(campaignId: string) {
  return isDemoMode && campaignId === demoCampaign.id ? demoCampaign : null;
}

export function getDemoSignals(campaignId: string) {
  return getDemoCampaign(campaignId)?.sponsorSignals ?? null;
}

export function getDemoLeads(campaignId: string) {
  return getDemoCampaign(campaignId)?.sponsorLeads ?? null;
}
