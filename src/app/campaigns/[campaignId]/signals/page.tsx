import Link from "next/link";
import { notFound } from "next/navigation";
import { SponsorConfidence, SponsorSignalSourceType, SponsorSignalStatus } from "@prisma/client";
import { ManualEvidenceForm } from "../manual-evidence-form";
import { confirmSelectedSignalAsLeadAction, rejectChannelNewSignalsAction } from "../../actions";
import { prisma } from "@/lib/prisma";

type CampaignSignalsPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ status?: string; confidence?: string; sourceType?: string; error?: string }>;
};

type SignalWithRelations = Awaited<ReturnType<typeof loadSignals>>[number];

export const dynamic = "force-dynamic";

export default async function CampaignSignalsPage({ params, searchParams }: CampaignSignalsPageProps) {
  const { campaignId } = await params;
  const filters = await searchParams;
  const status = filters.status === "ALL" ? undefined : getEnumValue(SponsorSignalStatus, filters.status) ?? SponsorSignalStatus.NEW;
  const confidence = getEnumValue(SponsorConfidence, filters.confidence);
  const sourceType = getEnumValue(SponsorSignalSourceType, filters.sourceType);
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    notFound();
  }

  const signals = await loadSignals(campaign.id, status, confidence, sourceType);
  const channelGroups = groupSignalsByChannel(signals);

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{campaign.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Peer channel sponsor evidence</h1>
        <p className="mt-2 text-muted-foreground">Review each peer channel once, verify all sponsor evidence found for that channel, then confirm useful leads or reject noise.</p>
      </div>

      {filters.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{filters.error}</div> : null}

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/campaigns/${campaign.id}/signals?status=ALL`} className="rounded-md border px-3 py-2">All</Link>
        {Object.values(SponsorSignalStatus).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?status=${value}`} className="rounded-md border px-3 py-2">{value}</Link>
        ))}
        {Object.values(SponsorConfidence).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?confidence=${value}`} className="rounded-md border px-3 py-2">{value}</Link>
        ))}
        {Object.values(SponsorSignalSourceType).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?sourceType=${value}`} className="rounded-md border px-3 py-2">{value}</Link>
        ))}
      </div>

      <ManualEvidenceForm campaignId={campaign.id} />

      <div className="grid gap-4">
        {channelGroups.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
            <h2 className="font-semibold">No peer channels with sponsor evidence found</h2>
            <p className="mt-2 text-sm text-muted-foreground">Try lowering min viewers, expanding max viewers, expanding languages, running discovery at another time, trying broader categories like Just Chatting, or manually adding evidence from Twitch panels, chat commands, YouTube descriptions, or Discord.</p>
          </div>
        ) : (
          channelGroups.map((group) => {
            const bestSignal = group.signals[0];
            const rejectChannel = rejectChannelNewSignalsAction.bind(null, campaign.id, group.channelId);
            const confirmSelected = confirmSelectedSignalAsLeadAction.bind(null, campaign.id);
            const sponsorNames = [...new Set(group.signals.map((signal) => signal.sponsorName).filter(Boolean))] as string[];

            return (
              <div key={group.channelId} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{group.peerChannelName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.login ? `@${group.login}` : "Manual peer channel"} · highest seen viewers {group.highestSeenViewers ?? "unknown"} · {group.gameCategory ?? "unknown category"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.signals.length} evidence item{group.signals.length === 1 ? "" : "s"} · highest confidence {group.highestConfidence} · highest score {group.highestScore}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      {group.login ? <a href={`https://www.twitch.tv/${group.login}`} target="_blank" rel="noreferrer" className="font-medium text-primary">Open Twitch</a> : null}
                      {bestSignal.manualSourceUrl ? <a href={bestSignal.manualSourceUrl} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{group.highestConfidence} · {group.highestScore}</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {group.signals.map((signal) => (
                    <div key={signal.id} className="rounded-lg border bg-background p-3 text-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium">{signal.sourceType}</p>
                          <p className="mt-1 text-muted-foreground">{signal.matchedText}</p>
                          {signal.matchedSponsorTerms.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Sponsor terms: {dedupe(signal.matchedSponsorTerms).join(", ")}</p> : null}
                          {signal.matchedContextTerms.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Context: {dedupe(signal.matchedContextTerms).join(", ")}</p> : null}
                          <div className="mt-1 flex flex-wrap gap-3 text-xs">
                            {signal.manualSourceUrl ? <a href={signal.manualSourceUrl} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                            {!signal.manualSourceUrl && signal.vod?.twitchVodId ? <a href={`https://www.twitch.tv/videos/${signal.vod.twitchVodId}`} target="_blank" rel="noreferrer" className="font-medium text-primary">Open source</a> : null}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{signal.confidence} · {signal.score} · {signal.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <form action={confirmSelected} className="grid gap-3 md:grid-cols-3 md:items-end">
                    <label className="grid gap-2 text-sm font-medium">
                      Evidence to confirm
                      <select name="signalId" defaultValue={bestSignal.id} className="rounded-md border bg-background px-3 py-2 font-normal">
                        {group.signals.map((signal) => (
                          <option key={signal.id} value={signal.id}>{signal.sourceType} · {signal.confidence} · {signal.score}</option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Sponsor name
                      <input name="sponsorName" required defaultValue={bestSignal.sponsorName ?? sponsorNames[0] ?? ""} list={`sponsors-${group.channelId}`} placeholder="Enter sponsor name" className="rounded-md border bg-background px-3 py-2 font-normal" />
                      <datalist id={`sponsors-${group.channelId}`}>{sponsorNames.map((name) => <option key={name} value={name} />)}</datalist>
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Sponsor category
                      <input name="sponsorCategory" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Sponsorship type
                      <input name="sponsorshipType" placeholder="Dedicated Stream" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Sponsor contact
                      <input name="sponsorContact" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Outreach status
                      <input name="outreachStatus" defaultValue="Not Contacted" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium md:col-span-2">
                      Notes
                      <input name="notes" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Confirm lead</button>
                  </form>
                  <form action={rejectChannel}>
                    <button type="submit" className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Reject all NEW signals for this channel</button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

async function loadSignals(campaignId: string, status?: SponsorSignalStatus, confidence?: SponsorConfidence, sourceType?: SponsorSignalSourceType) {
  return prisma.sponsorSignal.findMany({
    where: { campaignId, status, confidence, sourceType },
    orderBy: { createdAt: "desc" },
    include: { channel: true, streamSnapshot: true, vod: true },
  });
}

function groupSignalsByChannel(signals: SignalWithRelations[]) {
  const groups = new Map<string, SignalWithRelations[]>();

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
        gameCategory: sortedSignals.find((signal) => signal.streamSnapshot?.gameName || signal.manualGameCategory)?.streamSnapshot?.gameName ?? sortedSignals.find((signal) => signal.manualGameCategory)?.manualGameCategory ?? null,
        highestConfidence: sortedSignals[0].confidence,
        highestScore: sortedSignals[0].score,
      };
    })
    .sort((a, b) => compareSignals(a.signals[0], b.signals[0]));
}

function compareSignals(a: SignalWithRelations, b: SignalWithRelations) {
  const statusScore = Number(b.status === SponsorSignalStatus.NEW) - Number(a.status === SponsorSignalStatus.NEW);
  if (statusScore !== 0) return statusScore;
  const confidenceRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const confidenceScore = confidenceRank[b.confidence] - confidenceRank[a.confidence];
  if (confidenceScore !== 0) return confidenceScore;
  const viewerScore = (b.streamSnapshot?.viewerCount ?? b.manualSeenViewers ?? 0) - (a.streamSnapshot?.viewerCount ?? a.manualSeenViewers ?? 0);
  if (viewerScore !== 0) return viewerScore;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

function dedupe(values: string[]) {
  return [...new Set(values)];
}

function getEnumValue<T extends Record<string, string>>(enumObject: T, value?: string) {
  if (value && Object.values(enumObject).includes(value)) {
    return value as T[keyof T];
  }

  return undefined;
}
