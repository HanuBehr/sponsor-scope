import Link from "next/link";
import { notFound } from "next/navigation";
import { SponsorConfidence, SponsorSignalSourceType, SponsorSignalStatus } from "@prisma/client";
import { ManualEvidenceForm } from "../manual-evidence-form";
import { confirmSelectedSignalAsLeadAction, rejectChannelNewSignalsAction } from "../../actions";
import { prisma } from "@/lib/prisma";
import { getDemoCampaign, getDemoSignals } from "@/lib/demo";

type CampaignSignalsPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ status?: string; confidence?: string; sourceType?: string; selected?: string; error?: string }>;
};

type SignalWithRelations = Awaited<ReturnType<typeof loadSignals>>[number];

export const dynamic = "force-dynamic";

export default async function CampaignSignalsPage({ params, searchParams }: CampaignSignalsPageProps) {
  const { campaignId } = await params;
  const filters = await searchParams;
  const status = filters.status === "ALL" ? undefined : getEnumValue(SponsorSignalStatus, filters.status) ?? SponsorSignalStatus.NEW;
  const confidence = getEnumValue(SponsorConfidence, filters.confidence);
  const sourceType = getEnumValue(SponsorSignalSourceType, filters.sourceType);
  const demoCampaign = getDemoCampaign(campaignId);
  const campaign = demoCampaign ? { id: demoCampaign.id, name: demoCampaign.name } : await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    notFound();
  }

  const signals = getDemoSignals(campaign.id) ?? (await loadSignals(campaign.id, status, confidence, sourceType));
  const channelGroups = groupSignalsByChannel(signals);
  const selectedGroup = channelGroups.find((group) => group.channelId === filters.selected) ?? channelGroups[0];

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{campaign.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Sponsor evidence</h1>
          <p className="mt-2 text-muted-foreground">Review grouped peer-channel evidence and confirm useful sponsor leads.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="rounded bg-muted px-2.5 py-1">{channelGroups.length} channels</span>
          <span className="rounded bg-muted px-2.5 py-1">{signals.length} signals</span>
          <span className="rounded bg-primary/10 px-2.5 py-1 text-primary">{status ?? "ALL"}</span>
        </div>
      </div>

      {filters.error ? <div className="rounded bg-muted/50 p-3 text-sm text-foreground ring-1 ring-border/70">{filters.error}</div> : null}

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 text-sm text-muted-foreground sm:flex-wrap sm:overflow-visible">
        <Link href={`/campaigns/${campaign.id}/signals?status=ALL`} className="shrink-0 rounded px-3 py-1.5 text-primary ring-1 ring-primary/40 hover:bg-primary/10">All</Link>
        {Object.values(SponsorSignalStatus).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?status=${value}`} className="shrink-0 rounded px-3 py-1.5 text-primary ring-1 ring-primary/40 hover:bg-primary/10">{value}</Link>
        ))}
        {Object.values(SponsorConfidence).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?confidence=${value}`} className="shrink-0 rounded px-3 py-1.5 text-primary ring-1 ring-primary/40 hover:bg-primary/10">{value}</Link>
        ))}
        {Object.values(SponsorSignalSourceType).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?sourceType=${value}`} className="shrink-0 rounded px-3 py-1.5 text-primary ring-1 ring-primary/40 hover:bg-primary/10">{value}</Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <div className="min-w-0 overflow-hidden rounded-lg bg-card/60 ring-1 ring-border/70">
          <div className="hidden border-b border-border/70 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto]">
            <span>Evidence</span>
            <span className="hidden w-24 text-right sm:block">Strength</span>
            <span className="w-20 text-right">Status</span>
          </div>
        {channelGroups.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em]">No evidence in queue</h2>
            <p className="mt-2 text-xs text-muted-foreground">Run discovery, detect signals, or add manual evidence.</p>
          </div>
        ) : (
          channelGroups.map((group) => {
            const bestSignal = group.signals[0];
            const selected = selectedGroup?.channelId === group.channelId;

            return (
              <Link key={group.channelId} href={buildSignalsHref(campaign.id, filters, group.channelId)} className={`grid gap-3 border-b border-border/60 px-4 py-4 last:border-b-0 hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto] sm:items-start ${selected ? "bg-muted/80 shadow-[inset_3px_0_0_hsl(var(--primary))]" : ""}`}>
                <div className="min-w-0 pr-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="truncate font-medium">{group.peerChannelName}</h2>
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{group.signals.length} evidence</span>
                    {bestSignal.sponsorName ? <span className="truncate font-mono text-[11px] text-primary">{bestSignal.sponsorName}</span> : null}
                  </div>
                  <p className="mt-1 break-words font-mono text-[11px] leading-5 text-muted-foreground sm:line-clamp-2">{bestSignal.matchedText}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                    {group.login ? `@${group.login}` : "manual"} / {group.gameCategory ?? "unknown"} / seen {group.highestSeenViewers ?? "?"}
                  </p>
                </div>
                <div className="hidden w-24 text-right font-mono text-[11px] text-muted-foreground sm:block">
                  {group.highestConfidence}<br />{group.highestScore}
                </div>
                <div className={`w-fit rounded px-2 py-1 text-xs sm:w-20 sm:text-right ${bestSignal.status === SponsorSignalStatus.REJECTED ? "bg-red-950/30 text-red-300" : "bg-primary/10 text-primary"}`}>{bestSignal.status}</div>
              </Link>
            );
          })
        )}
        </div>

        <aside className="grid gap-5 xl:sticky xl:top-20 xl:self-start">
          {selectedGroup ? <EvidenceDetailPanel campaignId={campaign.id} group={selectedGroup} /> : null}
          <ManualEvidenceForm campaignId={campaign.id} />
        </aside>
      </div>
    </div>
  );
}

function EvidenceDetailPanel({ campaignId, group }: { campaignId: string; group: ReturnType<typeof groupSignalsByChannel>[number] }) {
  const bestSignal = group.signals[0];
  const rejectChannel = rejectChannelNewSignalsAction.bind(null, campaignId, group.channelId);
  const confirmSelected = confirmSelectedSignalAsLeadAction.bind(null, campaignId);
  const sponsorNames = [...new Set(group.signals.map((signal) => signal.sponsorName).filter(Boolean))] as string[];

  return (
    <section className="rounded-lg bg-card/60 p-4 ring-1 ring-border/70">
      <div>
        <p className="text-sm text-muted-foreground">Selected channel</p>
        <h2 className="mt-1 truncate text-lg font-semibold">{group.peerChannelName}</h2>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{group.login ? `@${group.login}` : "manual"} / {group.highestConfidence} / {group.highestScore}</p>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-2 py-1">{group.signals.length} evidence</span>
          <span className="rounded bg-muted px-2 py-1">seen {group.highestSeenViewers ?? "?"}</span>
          {group.gameCategory ? <span className="rounded bg-muted px-2 py-1">{group.gameCategory}</span> : null}
        </div>
        <div className="grid gap-2 text-sm text-primary sm:flex sm:flex-wrap">
          {group.login ? <a href={`https://www.twitch.tv/${group.login}`} target="_blank" rel="noreferrer">Open Twitch</a> : null}
          {bestSignal.manualSourceUrl ? <a href={bestSignal.manualSourceUrl} target="_blank" rel="noreferrer">Open Source</a> : null}
          {!bestSignal.manualSourceUrl && bestSignal.vod?.twitchVodId ? <a href={`https://www.twitch.tv/videos/${bestSignal.vod.twitchVodId}`} target="_blank" rel="noreferrer">Open Source</a> : null}
        </div>
        <div className="grid gap-2 border-y border-border/60 py-3">
          {group.signals.map((signal) => (
            <div key={signal.id} className="rounded bg-background/60 p-3">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>{signal.sourceType}</span>
                <span>{signal.confidence} / {signal.score} / {signal.status}</span>
              </div>
              <p className="mt-1 break-words text-sm leading-6 text-foreground">{signal.matchedText}</p>
              {signal.matchedSponsorTerms.length > 0 ? <p className="mt-1 font-mono text-[10px] text-muted-foreground">terms: {dedupe(signal.matchedSponsorTerms).join(", ")}</p> : null}
              {signal.manualSourceUrl ? <a href={signal.manualSourceUrl} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-[10px] text-primary">source</a> : null}
            </div>
          ))}
        </div>
        <details className="rounded bg-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">Confirm lead</summary>
          <form action={confirmSelected} className="mt-3 grid gap-3">
          <label className="grid gap-2 text-sm font-medium">
            Evidence
            <select name="signalId" defaultValue={bestSignal.id} className="rounded border bg-background px-3 py-2 font-normal">
              {group.signals.map((signal) => (
                <option key={signal.id} value={signal.id}>{signal.sourceType} / {signal.confidence} / {signal.score}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Sponsor
            <input name="sponsorName" required defaultValue={bestSignal.sponsorName ?? sponsorNames[0] ?? ""} list={`sponsors-${group.channelId}`} className="rounded border bg-background px-3 py-2 font-normal" />
            <datalist id={`sponsors-${group.channelId}`}>{sponsorNames.map((name) => <option key={name} value={name} />)}</datalist>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Category<input name="sponsorCategory" className="rounded border bg-background px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">Type<input name="sponsorshipType" placeholder="Dedicated Stream" className="rounded border bg-background px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">Contact<input name="sponsorContact" className="rounded border bg-background px-3 py-2 font-normal" /></label>
            <label className="grid gap-2 text-sm font-medium">Outreach<input name="outreachStatus" defaultValue="Not Contacted" className="rounded border bg-background px-3 py-2 font-normal" /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium">Notes<input name="notes" className="rounded border bg-background px-3 py-2 font-normal" /></label>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button type="submit" className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:w-auto">Confirm</button>
          </div>
          </form>
        </details>
        <form action={rejectChannel}>
          <button type="submit" className="w-full rounded px-3 py-2 text-sm text-red-300 ring-1 ring-red-900/60 hover:bg-red-950/30 sm:w-auto">Reject New</button>
        </form>
      </div>
    </section>
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

function buildSignalsHref(campaignId: string, filters: { status?: string; confidence?: string; sourceType?: string }, selected: string) {
  const params = new URLSearchParams();

  if (filters.status) params.set("status", filters.status);
  if (filters.confidence) params.set("confidence", filters.confidence);
  if (filters.sourceType) params.set("sourceType", filters.sourceType);

  params.set("selected", selected);

  return `/campaigns/${campaignId}/signals?${params.toString()}`;
}

function getEnumValue<T extends Record<string, string>>(enumObject: T, value?: string) {
  if (value && Object.values(enumObject).includes(value)) {
    return value as T[keyof T];
  }

  return undefined;
}
