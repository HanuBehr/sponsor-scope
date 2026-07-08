import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteCampaignAction, detectSignalsAction, runDiscoveryAction } from "../actions";
import { DetectSignalsButton } from "./detect-signals-button";
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
        take: 3,
        include: { channel: true },
      },
      sponsorLeads: {
        orderBy: { confirmedAt: "desc" },
        take: 3,
        include: { channel: true },
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
        <div className="mt-3 flex flex-wrap gap-2">
          {campaign.categories.map((category) => (
            <span key={category.id} className="rounded-full bg-secondary px-3 py-1 text-sm">
              {category.name} · {category.twitchId}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Sponsor keywords</h2>
        <p className="mt-3 text-sm text-muted-foreground">{campaign.sponsorKeywords.join(", ")}</p>
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Latest sponsor signals</h2>
            <p className="mt-1 text-sm text-muted-foreground">New detections are queued for manual review.</p>
          </div>
          <Link href={`/campaigns/${campaign.id}/signals`} className="text-sm font-medium text-primary">
            View all
          </Link>
        </div>
        {campaign.sponsorSignals.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No sponsor signals detected yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {campaign.sponsorSignals.map((signal) => (
              <div key={signal.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{signal.sponsorName ?? "Unknown sponsor"}</p>
                    <p className="mt-1 text-muted-foreground">{signal.sourceTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Matched: {signal.matchedText}</p>
                  </div>
                  <p className="text-muted-foreground">
                    {signal.confidence} · {signal.score} · {signal.status}
                  </p>
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
                      Found {run.streamsFound} · matched {run.streamsMatched} · VODs {run.vodsFetched}
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
          <p className="mt-3 text-sm text-muted-foreground">No stream snapshots captured yet.</p>
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
          <h2 className="font-semibold">Sponsor signals</h2>
          <p className="mt-2 text-sm text-muted-foreground">Review scored stream and VOD title matches.</p>
        </Link>
        <Link href={`/campaigns/${campaignId}/leads`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary">
          <h2 className="font-semibold">Confirmed leads</h2>
          <p className="mt-2 text-sm text-muted-foreground">Track approved sponsor opportunities.</p>
        </Link>
      </div>
    </div>
  );
}
