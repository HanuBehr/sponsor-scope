import { PrismaClient, SponsorConfidence, SponsorLeadStatus, SponsorSignalSourceType, SponsorSignalStatus } from "@prisma/client";

const prisma = new PrismaClient();

const sponsorKeywords = [
  "#ad",
  "sponsored",
  "sponsorship",
  "paid partnership",
  "partnered",
  "use code",
  "creator code",
  "discount",
  "affiliate",
  "drops",
  "giveaway",
  "play now",
  "beta",
  "early access",
  "new game",
];

async function main() {
  await prisma.exportLog.deleteMany();
  await prisma.sponsorLead.deleteMany();
  await prisma.sponsorSignal.deleteMany();
  await prisma.streamSnapshot.deleteMany();
  await prisma.vod.deleteMany();
  await prisma.discoveryRun.deleteMany();
  await prisma.campaignCategory.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.channel.deleteMany();

  const campaign = await prisma.campaign.create({
    data: {
      name: "Roblox Micro Sponsors",
      minViewers: 30,
      maxViewers: 500,
      languages: ["EN", "PT", "ES"],
      sponsorKeywords,
      categories: {
        create: [{ twitchId: "509658", name: "Roblox" }],
      },
    },
  });

  const run = await prisma.discoveryRun.create({
    data: {
      campaignId: campaign.id,
      status: "COMPLETED",
      startedAt: new Date("2026-07-01T14:00:00.000Z"),
      completedAt: new Date("2026-07-01T14:05:00.000Z"),
    },
  });

  const channels = await Promise.all([
    prisma.channel.create({ data: { twitchId: "1001", login: "blockbuilder", displayName: "BlockBuilder", language: "EN" } }),
    prisma.channel.create({ data: { twitchId: "1002", login: "robloxbr", displayName: "RobloxBR", language: "PT" } }),
    prisma.channel.create({ data: { twitchId: "1003", login: "bloquespro", displayName: "BloquesPro", language: "ES" } }),
  ]);

  const snapshots = await Promise.all([
    prisma.streamSnapshot.create({
      data: {
        channelId: channels[0].id,
        discoveryRunId: run.id,
        twitchStreamId: "stream-1001",
        title: "Sponsored by BlockBites - Roblox tycoon night",
        gameName: "Roblox",
        viewerCount: 146,
        language: "EN",
      },
    }),
    prisma.streamSnapshot.create({
      data: {
        channelId: channels[1].id,
        discoveryRunId: run.id,
        twitchStreamId: "stream-1002",
        title: "Roblox com giveaway no final da live",
        gameName: "Roblox",
        viewerCount: 88,
        language: "PT",
      },
    }),
    prisma.streamSnapshot.create({
      data: {
        channelId: channels[2].id,
        discoveryRunId: run.id,
        twitchStreamId: "stream-1003",
        title: "Use code CREATORCRATE for new drops",
        gameName: "Roblox",
        viewerCount: 212,
        language: "ES",
      },
    }),
  ]);

  const confirmedSignal = await prisma.sponsorSignal.create({
    data: {
      campaignId: campaign.id,
      channelId: channels[0].id,
      streamSnapshotId: snapshots[0].id,
      sourceType: SponsorSignalSourceType.STREAM_TITLE,
      sourceTitle: snapshots[0].title,
      matchedText: "sponsored by",
      sponsorName: "BlockBites",
      score: 85,
      confidence: SponsorConfidence.HIGH,
      status: SponsorSignalStatus.CONFIRMED,
    },
  });

  await prisma.sponsorSignal.createMany({
    data: [
      {
        campaignId: campaign.id,
        channelId: channels[1].id,
        streamSnapshotId: snapshots[1].id,
        sourceType: SponsorSignalSourceType.STREAM_TITLE,
        sourceTitle: snapshots[1].title,
        matchedText: "giveaway",
        score: 20,
        confidence: SponsorConfidence.LOW,
        status: SponsorSignalStatus.NEW,
      },
      {
        campaignId: campaign.id,
        channelId: channels[2].id,
        streamSnapshotId: snapshots[2].id,
        sourceType: SponsorSignalSourceType.STREAM_TITLE,
        sourceTitle: snapshots[2].title,
        matchedText: "use code",
        sponsorName: "CREATORCRATE",
        score: 70,
        confidence: SponsorConfidence.HIGH,
        status: SponsorSignalStatus.REVIEWED,
      },
    ],
  });

  await prisma.sponsorLead.create({
    data: {
      campaignId: campaign.id,
      channelId: channels[0].id,
      sponsorSignalId: confirmedSignal.id,
      sponsorName: "BlockBites",
      status: SponsorLeadStatus.CONFIRMED,
      notes: "Demo confirmed lead from high-confidence stream title signal.",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
