import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type CampaignLeadsPageProps = {
  params: Promise<{ campaignId: string }>;
};

export const dynamic = "force-dynamic";

export default async function CampaignLeadsPage({ params }: CampaignLeadsPageProps) {
  const { campaignId } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    notFound();
  }

  const leads = await prisma.sponsorLead.findMany({
    where: { campaignId: campaign.id },
    orderBy: { confirmedAt: "desc" },
    include: {
      channel: true,
      sponsorSignal: true,
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{campaign.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirmed leads</h1>
      </div>
      {leads.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <h2 className="font-semibold">No confirmed leads yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Confirm sponsor signals to create leads for this campaign.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{lead.sponsorName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.channel.displayName} · {lead.sponsorSignal.sourceTitle}</p>
                  {lead.notes ? <p className="mt-2 text-sm text-muted-foreground">Notes: {lead.notes}</p> : null}
                  {lead.sourceUrl ? (
                    <a href={lead.sourceUrl} className="mt-2 inline-flex text-sm font-medium text-primary" target="_blank" rel="noreferrer">
                      Open source
                    </a>
                  ) : null}
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{lead.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
