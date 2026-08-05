import { SponsorConfidence, SponsorSignalSourceType, SponsorSignalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scoreSponsorSignal } from "@/lib/scoring";

type DetectionResult = {
  scanned: number;
  created: number;
  skippedDuplicates: number;
};

type SignalCandidate = {
  campaignId: string;
  channelId: string;
  streamSnapshotId?: string;
  vodId?: string;
  sourceType: SponsorSignalSourceType;
  sourceTitle: string;
  campaignKeywords: string[];
};

export async function detectCampaignSponsorSignals(campaignId: string): Promise<DetectionResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, sponsorKeywords: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const streamSnapshots = await prisma.streamSnapshot.findMany({
    where: { discoveryRun: { campaignId: campaign.id } },
    select: { id: true, channelId: true, title: true },
  });
  const vods = await prisma.vod.findMany({
    where: {
      channel: {
        streamSnapshots: {
          some: { discoveryRun: { campaignId: campaign.id } },
        },
      },
    },
    select: { id: true, channelId: true, title: true, description: true },
  });

  const candidates: SignalCandidate[] = [
    ...streamSnapshots.map((snapshot) => ({
      campaignId: campaign.id,
      channelId: snapshot.channelId,
      streamSnapshotId: snapshot.id,
      sourceType: SponsorSignalSourceType.STREAM_TITLE,
      sourceTitle: snapshot.title,
      campaignKeywords: campaign.sponsorKeywords,
    })),
    ...vods.map((vod) => ({
      campaignId: campaign.id,
      channelId: vod.channelId,
      vodId: vod.id,
      sourceType: SponsorSignalSourceType.VOD_TITLE,
      sourceTitle: vod.title,
      campaignKeywords: campaign.sponsorKeywords,
    })),
    ...vods
      .filter((vod) => Boolean(vod.description?.trim()))
      .map((vod) => ({
        campaignId: campaign.id,
        channelId: vod.channelId,
        vodId: vod.id,
        sourceType: SponsorSignalSourceType.VOD_DESCRIPTION,
        sourceTitle: vod.description ?? "",
        campaignKeywords: campaign.sponsorKeywords,
      })),
  ];

  let created = 0;
  let skippedDuplicates = 0;

  for (const candidate of candidates) {
    const score = scoreSponsorSignal(candidate.sourceTitle, candidate.campaignKeywords);

    if (!score.hasSignal || !score.confidence) {
      continue;
    }

    const matchedText = buildMatchedText(candidate.sourceTitle);
    const sourceKey = buildSignalSourceKey(candidate);
    const existingSignal = await prisma.sponsorSignal.findFirst({
      where: {
        campaignId: candidate.campaignId,
        sourceType: candidate.sourceType,
        sourceKey,
      },
      select: { id: true },
    });

    if (existingSignal) {
      skippedDuplicates += 1;
      continue;
    }

    await prisma.sponsorSignal.create({
      data: {
        campaignId: candidate.campaignId,
        channelId: candidate.channelId,
        streamSnapshotId: candidate.streamSnapshotId,
        vodId: candidate.vodId,
        sourceType: candidate.sourceType,
        sourceTitle: candidate.sourceTitle,
        matchedText,
        matchedKeywords: score.matchedKeywords,
        matchedSponsorTerms: score.matchedSponsorTerms,
        matchedContextTerms: score.matchedContextTerms,
        sourceKey,
        sponsorName: score.sponsorName,
        score: score.score,
        confidence: score.confidence as SponsorConfidence,
        status: SponsorSignalStatus.NEW,
      },
    });

    created += 1;
  }

  return { scanned: candidates.length, created, skippedDuplicates };
}

function buildMatchedText(sourceTitle: string) {
  return sourceTitle.slice(0, 500);
}

export function buildSignalSourceKey(candidate: Pick<SignalCandidate, "streamSnapshotId" | "vodId" | "sourceType" | "sourceTitle" | "channelId">) {
  const sourceId = candidate.streamSnapshotId ?? candidate.vodId ?? candidate.channelId;
  return `${candidate.sourceType}:${sourceId}:${normalizeSourceTitle(candidate.sourceTitle)}`.slice(0, 500);
}

function normalizeSourceTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
