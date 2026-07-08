import Link from "next/link";
import { notFound } from "next/navigation";
import { SponsorConfidence, SponsorSignalStatus } from "@prisma/client";
import { confirmSignalAsLeadAction, rejectSignalAction } from "../../actions";
import { prisma } from "@/lib/prisma";

type CampaignSignalsPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ status?: string; confidence?: string; error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CampaignSignalsPage({ params, searchParams }: CampaignSignalsPageProps) {
  const { campaignId } = await params;
  const filters = await searchParams;
  const status = getEnumValue(SponsorSignalStatus, filters.status);
  const confidence = getEnumValue(SponsorConfidence, filters.confidence);
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    notFound();
  }

  const signals = await prisma.sponsorSignal.findMany({
    where: {
      campaignId: campaign.id,
      status,
      confidence,
    },
    orderBy: { createdAt: "desc" },
    include: {
      channel: true,
      streamSnapshot: true,
      vod: true,
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{campaign.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sponsor signals</h1>
      </div>

      {filters.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{filters.error}</div> : null}

      <div className="flex flex-wrap gap-2 text-sm">
        <Link href={`/campaigns/${campaign.id}/signals`} className="rounded-md border px-3 py-2">
          All
        </Link>
        {Object.values(SponsorSignalStatus).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?status=${value}`} className="rounded-md border px-3 py-2">
            {value}
          </Link>
        ))}
        {Object.values(SponsorConfidence).map((value) => (
          <Link key={value} href={`/campaigns/${campaign.id}/signals?confidence=${value}`} className="rounded-md border px-3 py-2">
            {value}
          </Link>
        ))}
      </div>

      <div className="grid gap-3">
        {signals.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
            <h2 className="font-semibold">No sponsor signals found</h2>
            <p className="mt-2 text-sm text-muted-foreground">Run discovery, then detect sponsor signals from stream and VOD titles.</p>
          </div>
        ) : (
          signals.map((signal) => {
            const confirmSignal = confirmSignalAsLeadAction.bind(null, campaign.id, signal.id);
            const rejectSignal = rejectSignalAction.bind(null, campaign.id, signal.id);

            return (
              <div key={signal.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{signal.sponsorName ?? "Unknown sponsor"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{signal.sourceTitle}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {signal.channel.displayName} · {signal.sourceType} · Matched: {signal.matchedText}
                  </p>
                  {signal.matchedKeywords.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Keywords: {signal.matchedKeywords.join(", ")}</p> : null}
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {signal.confidence} · {signal.score} · {signal.status}
                </span>
              </div>
              {signal.status !== SponsorSignalStatus.CONFIRMED ? (
                <div className="mt-5 grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <form action={confirmSignal} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="grid gap-2 text-sm font-medium">
                      Sponsor name
                      <input name="sponsorName" required defaultValue={signal.sponsorName ?? ""} placeholder="Enter sponsor name" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <label className="grid gap-2 text-sm font-medium">
                      Notes
                      <input name="notes" placeholder="Optional" className="rounded-md border bg-background px-3 py-2 font-normal" />
                    </label>
                    <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                      Confirm as lead
                    </button>
                  </form>
                  {signal.status !== SponsorSignalStatus.REJECTED ? (
                    <form action={rejectSignal}>
                      <button type="submit" className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                        Ignore signal
                      </button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function getEnumValue<T extends Record<string, string>>(enumObject: T, value?: string) {
  if (value && Object.values(enumObject).includes(value)) {
    return value as T[keyof T];
  }

  return undefined;
}
