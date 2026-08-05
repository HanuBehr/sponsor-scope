import { notFound } from "next/navigation";
import { SponsorLeadStatus } from "@prisma/client";
import { exportUnexportedLeadsAction, updateLeadExportFieldsAction } from "../../actions";
import { prisma } from "@/lib/prisma";
import { demoExportLogs, getDemoCampaign, getDemoLeads } from "@/lib/demo";

type CampaignLeadsPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ export?: string; exported?: string; attempted?: string; message?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CampaignLeadsPage({ params, searchParams }: CampaignLeadsPageProps) {
  const { campaignId } = await params;
  const exportState = await searchParams;
  const demoCampaign = getDemoCampaign(campaignId);
  const campaign = demoCampaign ? { id: demoCampaign.id, name: demoCampaign.name } : await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true },
  });

  if (!campaign) {
    notFound();
  }

  const leads = getDemoLeads(campaign.id) ?? (await prisma.sponsorLead.findMany({
    where: { campaignId: campaign.id },
    orderBy: { confirmedAt: "desc" },
    include: {
      channel: true,
      sponsorSignal: { include: { streamSnapshot: true, vod: true } },
    },
  }));
  const sortedLeads = leads.sort((a, b) => {
    const exportScore = Number(!b.exportedAt) - Number(!a.exportedAt);
    if (exportScore !== 0) return exportScore;
    const confirmedScore = Number(b.status === SponsorLeadStatus.CONFIRMED) - Number(a.status === SponsorLeadStatus.CONFIRMED);
    if (confirmedScore !== 0) return confirmedScore;
    const completenessScore = Number(Boolean(b.sponsorName && b.sponsorContact)) - Number(Boolean(a.sponsorName && a.sponsorContact));
    if (completenessScore !== 0) return completenessScore;
    return (b.sponsorSignal.streamSnapshot?.viewerCount ?? b.sponsorSignal.manualSeenViewers ?? 0) - (a.sponsorSignal.streamSnapshot?.viewerCount ?? a.sponsorSignal.manualSeenViewers ?? 0);
  });
  const exportLogs = demoCampaign ? demoExportLogs : await prisma.exportLog.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const unexportedLeadCount = leads.filter((lead) => lead.status === SponsorLeadStatus.CONFIRMED && !lead.exportedAt).length;
  const exportUnexportedLeads = exportUnexportedLeadsAction.bind(null, campaign.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{campaign.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Confirmed leads</h1>
          <p className="mt-2 text-muted-foreground">{unexportedLeadCount} confirmed leads are ready for Google Sheets export.</p>
        </div>
        <form action={exportUnexportedLeads} className="w-full sm:w-auto">
          <button type="submit" disabled={unexportedLeadCount === 0} className="w-full rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            Export unexported leads
          </button>
        </form>
      </div>

      {exportState.export === "success" ? (
        <div className="rounded bg-emerald-950/20 p-3 text-sm text-emerald-300 ring-1 ring-emerald-900/50">
          Export completed. Exported {exportState.exported ?? "0"} of {exportState.attempted ?? "0"} unexported leads.
        </div>
      ) : null}

      {exportState.export === "partial" ? (
        <div className="rounded bg-muted/50 p-3 text-sm text-foreground ring-1 ring-border/70">
          Export partially completed. Exported {exportState.exported ?? "0"} of {exportState.attempted ?? "0"}. {exportState.message}
        </div>
      ) : null}

      {exportState.export === "failed" ? <div className="rounded bg-muted/50 p-3 text-sm text-foreground ring-1 ring-border/70">Export failed: {exportState.message ?? "Unknown error"}</div> : null}

      {unexportedLeadCount === 0 && leads.length > 0 ? <div className="rounded bg-muted/40 p-3 text-sm text-muted-foreground ring-1 ring-border/60">No unexported confirmed leads.</div> : null}

      {sortedLeads.length === 0 ? (
        <div className="rounded-lg bg-card/60 px-4 py-10 text-center ring-1 ring-border/70">
          <h2 className="font-semibold">No leads</h2>
          <p className="mt-2 text-xs text-muted-foreground">Confirm evidence from the review queue.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-card/60 ring-1 ring-border/70">
          <div className="hidden border-b border-border/70 px-4 py-3 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_auto]">
            <span>Lead</span>
            <span>Status</span>
          </div>
          {sortedLeads.map((lead) => {
            const updateLead = updateLeadExportFieldsAction.bind(null, campaign.id, lead.id);

            return (
              <div key={lead.id} className="border-b border-border/60 p-4 last:border-b-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{lead.sponsorName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.sponsorSignal.manualPeerChannel ?? lead.channel.displayName} {lead.channel.login && !lead.channel.login.startsWith("manual-") ? `(@${lead.channel.login})` : ""} · viewers {lead.sponsorSignal.streamSnapshot?.viewerCount ?? lead.sponsorSignal.manualSeenViewers ?? "unknown"}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{lead.sponsorSignal.sourceTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{lead.exportedAt ? `Exported to ${lead.exportedTab ?? "Sheets"} at ${lead.exportedAt.toLocaleString()}` : "Not exported"}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {lead.channel.login && !lead.channel.login.startsWith("manual-") ? (
                    <a href={`https://www.twitch.tv/${lead.channel.login}`} className="font-medium text-primary" target="_blank" rel="noreferrer">
                      Open Twitch
                    </a>
                  ) : null}
                  {lead.sourceUrl ? (
                    <a href={lead.sourceUrl} className="mt-2 inline-flex text-sm font-medium text-primary" target="_blank" rel="noreferrer">
                      Open source
                    </a>
                  ) : null}
                  </div>
                </div>
                <span className="w-fit rounded bg-primary/10 px-2 py-1 text-xs text-primary">{lead.status}</span>
              </div>
              <details className="mt-3 rounded bg-muted/30 p-3">
                <summary className="cursor-pointer text-sm font-medium">Edit export fields</summary>
                <form action={updateLead} className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Category
                  <input name="sponsorCategory" defaultValue={lead.sponsorCategory ?? ""} className="rounded border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Type
                  <input name="sponsorshipType" defaultValue={lead.sponsorshipType ?? ""} placeholder="Dedicated Stream" className="rounded border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Contact
                  <input name="sponsorContact" defaultValue={lead.sponsorContact ?? ""} className="rounded border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Outreach
                  <input name="outreachStatus" defaultValue={lead.outreachStatus} className="rounded border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  Notes
                  <textarea name="notes" rows={2} defaultValue={lead.notes ?? ""} className="rounded border bg-background px-3 py-2 font-normal" />
                </label>
                <button type="submit" className="w-full rounded px-4 py-2 text-sm text-primary ring-1 ring-primary/40 hover:bg-primary/10 sm:w-fit">
                  Save
                </button>
              </form>
              </details>
            </div>
            );
          })}
        </div>
      )}

      <section className="rounded-lg bg-card/60 p-4 ring-1 ring-border/70">
        <h2 className="font-semibold">Export logs</h2>
        {exportLogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No exports have run yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded bg-background/40">
            {exportLogs.map((log) => (
              <div key={log.id} className="p-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{log.destination}</p>
                    <p className="mt-1 text-muted-foreground">
                      {log.status} · {log.rowCount} rows
                    </p>
                    {log.errorMessage ? <p className="mt-1 text-muted-foreground">{log.errorMessage}</p> : null}
                  </div>
                  <p className="text-muted-foreground">{log.createdAt.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
