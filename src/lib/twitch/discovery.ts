import { DiscoveryRunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStreamsByGameId, getVideosByUserId } from "@/lib/twitch";

type DiscoveryResult = {
  runId: string;
  status: DiscoveryRunStatus;
  streamsFound: number;
  streamsMatched: number;
  vodsFetched: number;
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
  let vodsFetched = 0;

  try {
    const allowedLanguages = new Set(campaign.languages.map((language) => language.toLowerCase()));

    for (const category of campaign.categories) {
      const streamResponse = await getStreamsByGameId(category.twitchId);
      streamsFound += streamResponse.data.length;

      const matchedStreams = streamResponse.data.filter((stream) => {
        const languageMatches = allowedLanguages.size === 0 || allowedLanguages.has(stream.language.toLowerCase());
        return stream.viewer_count >= campaign.minViewers && stream.viewer_count <= campaign.maxViewers && languageMatches;
      });

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
              publishedAt: new Date(video.published_at),
              duration: video.duration,
              viewCount: video.view_count,
            },
            create: {
              channelId: channel.id,
              twitchVodId: video.id,
              title: video.title,
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
        vodsFetched,
        completedAt: new Date(),
      },
    });

    return { runId: run.id, status: DiscoveryRunStatus.COMPLETED, streamsFound, streamsMatched, vodsFetched, errorMessage: null };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Discovery failed";

    await prisma.discoveryRun.update({
      where: { id: run.id },
      data: {
        status: DiscoveryRunStatus.FAILED,
        streamsFound,
        streamsMatched,
        vodsFetched,
        completedAt: new Date(),
        errorMessage,
      },
    });

    return { runId: run.id, status: DiscoveryRunStatus.FAILED, streamsFound, streamsMatched, vodsFetched, errorMessage };
  }
}
