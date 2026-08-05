import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDemoCampaigns } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = getDemoCampaigns() ?? (await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { orderBy: { createdAt: "asc" } },
      _count: { select: { sponsorSignals: true, sponsorLeads: true } },
    },
  }));

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Research campaigns</h1>
          <p className="mt-2 text-muted-foreground">Choose a campaign to collect and review sponsor evidence from peer Twitch channels.</p>
        </div>
        <Link href="/campaigns/new" className="w-full rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground sm:w-fit">
          New campaign
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-lg bg-card/60 px-4 py-10 text-center ring-1 ring-border/70">
          <h2 className="font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create a peer-channel research target to start collecting evidence.</p>
          <Link href="/campaigns/new" className="mt-4 inline-flex rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Create
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-card/60 ring-1 ring-border/70">
          <div className="hidden border-b border-border/70 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_auto_auto]">
            <span>Campaign</span>
            <span className="hidden w-28 text-right sm:block">Range</span>
            <span className="w-28 text-right">Records</span>
          </div>
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="grid gap-3 border-b border-border/60 px-4 py-4 last:border-b-0 hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="min-w-0">
                <h2 className="truncate font-medium">{campaign.name}</h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {campaign.targetChannelName ? `@${campaign.targetChannelName} / ` : ""}{campaign.categories.map((category) => category.name).join(", ") || "no categories"} / {campaign.languages.join(",")}
                </p>
              </div>
              <div className="font-mono text-xs text-muted-foreground sm:w-28 sm:text-right">
                <span className="sm:hidden">Range </span>
                {campaign.minViewers}-{campaign.maxViewers}
              </div>
              <div className="font-mono text-xs text-muted-foreground sm:w-28 sm:text-right">
                {campaign._count.sponsorSignals} sig / {campaign._count.sponsorLeads} lead
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
