import { DiscoveryRunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStreamsByGameId, getVideosByUserId } from "@/lib/twitch";

type DiscoveryResult = {
  runId: string;
  status: DiscoveryRunStatus;
  streamsFound: number;
  streamsMatched: number;
  vodsFetched: number;
  streamsFilteredByViewers: number;
  streamsFilteredByLanguage: number;
  errorMessage: string | null;
};

export async function runCampaignDiscovery(campaignId: string): Promise<DiscoveryResult> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { categories: true },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const startedAt = new Date();
  const run = await prisma.discoveryRun.create({
    data: {
      campaignId: campaign.id,
      status: DiscoveryRunStatus.RUNNING,
      startedAt,
    },
  });

  let streamsFound = 0;
  let streamsMatched = 0;
  let streamsFilteredByViewers = 0;
  let streamsFilteredByLanguage = 0;
  let vodsFetched = 0;

  try {
    const allowedLanguages = new Set(campaign.languages.map((language) => normalizeLanguage(language)).filter(Boolean));

    for (const category of campaign.categories) {
      const streamResponse = await getStreamsByGameId(category.twitchId);
      streamsFound += streamResponse.data.length;

      const matchedStreams = [];

      for (const stream of streamResponse.data) {
        const viewerMatches = stream.viewer_count >= campaign.minViewers && stream.viewer_count <= campaign.maxViewers;
        const languageMatches = allowedLanguages.size === 0 || allowedLanguages.has(normalizeLanguage(stream.language));

        if (!viewerMatches) {
          streamsFilteredByViewers += 1;
          continue;
        }

        if (!languageMatches) {
          streamsFilteredByLanguage += 1;
          continue;
        }

        matchedStreams.push(stream);
      }

      streamsMatched += matchedStreams.length;

      for (const stream of matchedStreams) {
        const channel = await prisma.channel.upsert({
          where: { twitchId: stream.user_id },
          update: {
            login: stream.user_login,
            displayName: stream.user_name,
            language: stream.language.toUpperCase(),
          },
          create: {
            twitchId: stream.user_id,
            login: stream.user_login,
            displayName: stream.user_name,
            language: stream.language.toUpperCase(),
          },
        });

        await prisma.streamSnapshot.create({
          data: {
            channelId: channel.id,
            discoveryRunId: run.id,
            twitchStreamId: stream.id,
            title: stream.title,
            gameName: stream.game_name,
            viewerCount: stream.viewer_count,
            language: stream.language.toUpperCase(),
            capturedAt: new Date(),
          },
        });

        const videoResponse = await getVideosByUserId(stream.user_id);
        vodsFetched += videoResponse.data.length;

        for (const video of videoResponse.data) {
          await prisma.vod.upsert({
            where: { twitchVodId: video.id },
            update: {
              channelId: channel.id,
              title: video.title,
              description: video.description,
              publishedAt: new Date(video.published_at),
              duration: video.duration,
              viewCount: video.view_count,
            },
            create: {
              channelId: channel.id,
              twitchVodId: video.id,
              title: video.title,
              description: video.description,
              publishedAt: new Date(video.published_at),
              duration: video.duration,
              viewCount: video.view_count,
            },
          });
        }
      }
    }

    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        status: DiscoveryRunStatus.COMPLETED,
        streamsFound,
        streamsMatched,
        streamsFilteredByViewers,
        streamsFilteredByLanguage,
        vodsFetched,
        completedAt: new Date(),
      },
    });

    return { runId: run.id, status: DiscoveryRunStatus.COMPLETED, streamsFound, streamsMatched, streamsFilteredByViewers, streamsFilteredByLanguage, vodsFetched, errorMessage: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Discovery failed";

    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        status: DiscoveryRunStatus.FAILED,
        streamsFound,
        streamsMatched,
        streamsFilteredByViewers,
        streamsFilteredByLanguage,
        vodsFetched,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return { runId: run.id, status: DiscoveryRunStatus.FAILED, streamsFound, streamsMatched, streamsFilteredByViewers, streamsFilteredByLanguage, vodsFetched, errorMessage };
  }
}

function normalizeLanguage(language: string) {
  return language.trim().toLowerCase();
}
