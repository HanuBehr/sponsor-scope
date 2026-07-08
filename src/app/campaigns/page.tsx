import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      categories: { orderBy: { createdAt: "asc" } },
      _count: { select: { sponsorSignals: true, sponsorLeads: true } },
    },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-2 text-muted-foreground">Manage sponsor market research campaigns.</p>
        </div>
        <Link href="/campaigns/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New campaign
        </Link>
      </div>
      {campaigns.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <h2 className="font-semibold">No campaigns yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create a campaign to start researching sponsor signals.</p>
          <Link href="/campaigns/new" className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Create campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{campaign.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {campaign.minViewers}-{campaign.maxViewers} viewers · {campaign.languages.join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{campaign.categories.map((category) => category.name).join(", ") || "No categories"}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {campaign._count.sponsorSignals} signals · {campaign._count.sponsorLeads} leads
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
