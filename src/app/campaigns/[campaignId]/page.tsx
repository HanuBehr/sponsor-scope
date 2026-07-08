import Link from "next/link";
import { notFound } from "next/navigation";
import { confirmSignalAsLeadAction, deleteCampaignAction, detectSignalsAction, rejectChannelNewSignalsAction, runDiscoveryAction } from "../actions";
import { DetectSignalsButton } from "./detect-signals-button";
import { ManualEvidenceForm } from "./manual-evidence-form";
import { RunDiscoveryButton } from "./run-discovery-button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CampaignPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ discovery?: string; signals?: string; message?: string; streams?: string; vods?: string; created?: string; scanned?: string; duplicates?: string }>;
};

export default async function CampaignPage({ params, searchParams }: CampaignPageProps) {
  const { campaignId } = await params;
  const discoveryState = await searchParams;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      categories: { orderBy: { createdAt: "asc" } },
      discoveryRuns: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      sponsorSignals: {
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { channel: true, streamSnapshot: true, vod: true },
      },
      sponsorLeads: {
        orderBy: { confirmedAt: "desc" },
        take: 3,
        include: { channel: true, sponsorSignal: true },
      },
      _count: { select: { sponsorSignals: true, sponsorLeads: true, discoveryRuns: true } },
    },
  });

  if (!campaign) {
    notFound();
  }

  const deleteCampaign = deleteCampaignAction.bind(null, campaign.id);
  const runDiscovery = runDiscoveryAction.bind(null, campaign.id);
  const detectSignals = detectSignalsAction.bind(null, campaign.id);
  const latestSignalGroups = groupSignalsByChannel(campaign.sponsorSignals).slice(0, 3);
  const streamSnapshots = await prisma.streamSnapshot.findMany({
    where: { discoveryRun: { campaignId: campaign.id } },
    orderBy: { capturedAt: "desc" },
    take: 10,
    include: { channel: true, discoveryRun: true },
  });
  const vods = await prisma.vod.findMany({
    where: {
      channel: {
        streamSnapshots: {
          some: {
            discoveryRun: { campaignId: campaign.id },
          },
        },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
    include: { channel: true },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Campaign ID: {campaign.id}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {campaign.minViewers}-{campaign.maxViewers} viewers · {campaign.languages.join(", ")}
          </p>
          {(campaign.targetChannelName || campaign.targetNiche || campaign.targetAvgViewers) ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Researching sponsors for {campaign.targetChannelName ?? "my channel"}
              {campaign.targetNiche ? ` in ${campaign.targetNiche}` : ""}
              {campaign.targetAvgViewers ? ` around ${campaign.targetAvgViewers} avg viewers` : ""}.
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <form action={runDiscovery}>
            <RunDiscoveryButton />
          </form>
          <form action={detectSignals}>
            <DetectSignalsButton />
          </form>
          <Link href={`/campaigns/${campaign.id}/edit`} className="rounded-md border px-4 py-2 text-sm font-medium">
            Edit
          </Link>
          <form action={deleteCampaign}>
            <button type="submit" className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              Delete
            </button>
          </form>
        </div>
      </div>

      {discoveryState.discovery === "success" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Discovery completed. Matched {discoveryState.streams ?? "0"} streams and fetched {discoveryState.vods ?? "0"} VODs.
        </div>
      ) : null}

      {discoveryState.discovery === "failed" ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Discovery failed: {discoveryState.message ?? "Unknown error"}</div>
      ) : null}

      {discoveryState.signals === "success" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Signal detection completed. Created {discoveryState.created ?? "0"} signals from {discoveryState.scanned ?? "0"} records. Skipped {discoveryState.duplicates ?? "0"} duplicates.
        </div>
      ) : null}

      {discoveryState.signals === "failed" ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Signal detection failed: {discoveryState.message ?? "Unknown error"}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Signals</p>
          <p className="mt-2 text-2xl font-semibold">{campaign._count.sponsorSignals}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Leads</p>
          <p className="mt-2 text-2xl font-semibold">{campaign._count.sponsorLeads}</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Runs</p>
          <p className="mt-2 text-2xl font-semibold">{campaign._count.discoveryRuns}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Categories</h2>
        <p className="mt-1 text-sm text-muted-foreground">Peer channel discovery categories. These provide context only and do not create sponsor signals by themselves.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {campaign.categories.map((category) => (
            <span key={category.id} className="rounded-full bg-secondary px-3 py-1 text-sm">
              {category.name} · {category.twitchId}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Sponsor evidence terms</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sponsor-intent, conversion, and Twitch-surface terms used to find real sponsor evidence.</p>
        <p className="mt-3 text-sm text-muted-foreground">{campaign.sponsorKeywords.join(", ")}</p>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Latest sponsor signals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Possible sponsor evidence found on peer channels. Confirm only brands useful for outreach.</p>
          </div>
          <Link href={`/campaigns/${campaign.id}/signals`} className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        {latestSignalGroups.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No sponsor signals detected yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {latestSignalGroups.map((group) => {
              const bestSignal = group.signals[0];

              return (
              <div key={group.channelId} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{group.peerChannelName}</p>
                    <p className="mt-1 text-muted-foreground">{group.signals.length} evidence item{group.signals.length === 1 ? "" : "s"} · highest viewers {group.highestSeenViewers ?? "unknown"}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {group.login ? <a href={`https://www.twitch.tv/${group.login}`} target="_blank" rel="noreferrer" className="font-medium text-primary">Open Twitch</a> : null}
                      {bestSignal.manualSourceUrl ? <a href={bestSignal.manualSourceUrl} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                      {!bestSignal.manualSourceUrl && bestSignal.vod?.twitchVodId ? <a href={`https://www.twitch.tv/videos/${bestSignal.vod.twitchVodId}`} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Best proof: {bestSignal.matchedText}</p>
                    {bestSignal.matchedSponsorTerms.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Sponsor terms: {[...new Set(bestSignal.matchedSponsorTerms)].join(", ")}</p> : null}
                  </div>
                  <p className="text-muted-foreground">
                    {group.highestConfidence} · {group.highestScore}
                  </p>
                </div>
                {bestSignal.status !== "CONFIRMED" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={confirmSignalAsLeadAction.bind(null, campaign.id, bestSignal.id)} className="flex flex-wrap gap-2">
                      <input name="sponsorName" defaultValue={bestSignal.sponsorName ?? ""} placeholder="Sponsor name" required className="rounded-md border bg-background px-3 py-2 text-sm" />
                      <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Confirm Lead</button>
                    </form>
                    {group.hasNewSignals ? (
                      <form action={rejectChannelNewSignalsAction.bind(null, campaign.id, group.channelId)}>
                        <button type="submit" className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Reject NEW for channel</button>
                      </form>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
            })}
          </div>
        )}
      </section>

      <ManualEvidenceForm campaignId={campaign.id} />

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Latest confirmed leads</h2>
            <p className="mt-1 text-sm text-muted-foreground">Signals confirmed as sponsor opportunities.</p>
          </div>
          <Link href={`/campaigns/${campaign.id}/leads`} className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        {campaign.sponsorLeads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No confirmed leads yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {campaign.sponsorLeads.map((lead) => (
              <div key={lead.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{lead.sponsorName}</p>
                    <p className="mt-1 text-muted-foreground">{lead.sponsorSignal.manualPeerChannel ?? lead.channel.displayName} · {lead.sponsorSignal.sourceTitle}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs">
                      {lead.channel.login && !lead.channel.login.startsWith("manual-") ? <a href={`https://www.twitch.tv/${lead.channel.login}`} target="_blank" rel="noreferrer" className="font-medium text-primary">Open Twitch</a> : null}
                      {lead.sourceUrl ? <a href={lead.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                    </div>
                    {lead.notes ? <p className="mt-1 text-xs text-muted-foreground">Notes: {lead.notes}</p> : null}
                  </div>
                  <p className="text-muted-foreground">{lead.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Latest discovery runs</h2>
        {campaign.discoveryRuns.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No discovery runs yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {campaign.discoveryRuns.map((run) => (
              <div key={run.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{run.status}</p>
                    <p className="mt-1 text-muted-foreground">
                      Fetched {run.streamsFound} · matched {run.streamsMatched} · filtered by viewers {run.streamsFilteredByViewers} · filtered by language {run.streamsFilteredByLanguage} · VODs {run.vodsFetched}
                    </p>
                  </div>
                  <p className="text-muted-foreground">{run.startedAt ? run.startedAt.toLocaleString() : "Not started"}</p>
                </div>
                {run.errorMessage ? <p className="mt-2 text-red-700">{run.errorMessage}</p> : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Latest stream snapshots</h2>
        {streamSnapshots.length === 0 ? (
          <div className="mt-3 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <p>No peer stream snapshots captured yet.</p>
            <p className="mt-2">Try lowering minimum viewers, increasing max viewers, adding more languages, running discovery at a different time, or adding broader categories like Just Chatting.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {streamSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{snapshot.channel.displayName}</p>
                    <p className="mt-1 text-muted-foreground">{snapshot.title}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {snapshot.viewerCount} viewers · {snapshot.language}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Latest VODs</h2>
        {vods.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No recent VOD metadata fetched yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {vods.map((vod) => (
              <div key={vod.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{vod.channel.displayName}</p>
                    <p className="mt-1 text-muted-foreground">{vod.title}</p>
                  </div>
                  <p className="text-muted-foreground">{vod.viewCount ?? 0} views</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={`/campaigns/${campaignId}/signals`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary">
          <h2 className="font-semibold">Sponsor evidence</h2>
          <p className="mt-2 text-sm text-muted-foreground">Review proof found on peer channels.</p>
        </Link>
        <Link href={`/campaigns/${campaignId}/leads`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary">
          <h2 className="font-semibold">Outreach-ready leads</h2>
          <p className="mt-2 text-sm text-muted-foreground">Track confirmed sponsor opportunities for outreach.</p>
        </Link>
      </div>
    </div>
  );
}

type CampaignSignal = {
  id: string;
  channelId: string;
  sourceType: string;
  matchedText: string;
  matchedSponsorTerms: string[];
  sponsorName: string | null;
  score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  createdAt: Date;
  manualSourceUrl: string | null;
  manualPeerChannel: string | null;
  manualSeenViewers: number | null;
  channel: { login: string; displayName: string };
  streamSnapshot: { viewerCount: number } | null;
  vod: { twitchVodId: string } | null;
};

function groupSignalsByChannel(signals: CampaignSignal[]) {
  const groups = new Map<string, CampaignSignal[]>();

  for (const signal of signals) {
    groups.set(signal.channelId, [...(groups.get(signal.channelId) ?? []), signal]);
  }

  return [...groups.entries()]
    .map(([channelId, channelSignals]) => {
      const sortedSignals = channelSignals.sort(compareSignals);
      const bestSignal = sortedSignals[0];

      return {
        channelId,
        signals: sortedSignals,
        peerChannelName: bestSignal.manualPeerChannel ?? bestSignal.channel.displayName,
        login: bestSignal.channel.login && !bestSignal.channel.login.startsWith("manual-") ? bestSignal.channel.login : null,
        highestSeenViewers: Math.max(...sortedSignals.map((signal) => signal.streamSnapshot?.viewerCount ?? signal.manualSeenViewers ?? 0)) || null,
        highestConfidence: sortedSignals[0].confidence,
        highestScore: sortedSignals[0].score,
        hasNewSignals: sortedSignals.some((signal) => signal.status === "NEW"),
      };
    })
    .sort((a, b) => compareSignals(a.signals[0], b.signals[0]));
}

function compareSignals(a: CampaignSignal, b: CampaignSignal) {
  const statusScore = Number(b.status === "NEW") - Number(a.status === "NEW");
  if (statusScore !== 0) return statusScore;
  const confidenceRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const confidenceScore = confidenceRank[b.confidence] - confidenceRank[a.confidence];
  if (confidenceScore !== 0) return confidenceScore;
  const viewerScore = (b.streamSnapshot?.viewerCount ?? b.manualSeenViewers ?? 0) - (a.streamSnapshot?.viewerCount ?? a.manualSeenViewers ?? 0);
  if (viewerScore !== 0) return viewerScore;
  return b.createdAt.getTime() - a.createdAt.getTime();
}
