import { notFound } from "next/navigation";
import { SponsorLeadStatus } from "@prisma/client";
import { exportUnexportedLeadsAction, updateLeadExportFieldsAction } from "../../actions";
import { prisma } from "@/lib/prisma";

type CampaignLeadsPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ export?: string; exported?: string; attempted?: string; message?: string }>;
};

export const dynamic = "force-dynamic";

export default async function CampaignLeadsPage({ params, searchParams }: CampaignLeadsPageProps) {
  const { campaignId } = await params;
  const exportState = await searchParams;
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
      sponsorSignal: { include: { streamSnapshot: true, vod: true } },
    },
  });
  const sortedLeads = leads.sort((a, b) => {
    const exportScore = Number(!b.exportedAt) - Number(!a.exportedAt);
    if (exportScore !== 0) return exportScore;
    const confirmedScore = Number(b.status === SponsorLeadStatus.CONFIRMED) - Number(a.status === SponsorLeadStatus.CONFIRMED);
    if (confirmedScore !== 0) return confirmedScore;
    const completenessScore = Number(Boolean(b.sponsorName && b.sponsorContact)) - Number(Boolean(a.sponsorName && a.sponsorContact));
    if (completenessScore !== 0) return completenessScore;
    return (b.sponsorSignal.streamSnapshot?.viewerCount ?? b.sponsorSignal.manualSeenViewers ?? 0) - (a.sponsorSignal.streamSnapshot?.viewerCount ?? a.sponsorSignal.manualSeenViewers ?? 0);
  });
  const exportLogs = await prisma.exportLog.findMany({
    where: { campaignId: campaign.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const unexportedLeadCount = leads.filter((lead) => lead.status === SponsorLeadStatus.CONFIRMED && !lead.exportedAt).length;
  const exportUnexportedLeads = exportUnexportedLeadsAction.bind(null, campaign.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{campaign.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Outreach-ready leads</h1>
          <p className="mt-2 text-sm text-muted-foreground">Confirmed sponsor opportunities from peer-channel evidence. {unexportedLeadCount} unexported leads are ready for Google Sheets.</p>
        </div>
        <form action={exportUnexportedLeads}>
          <button type="submit" disabled={unexportedLeadCount === 0} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
            Export unexported leads to Google Sheets
          </button>
        </form>
      </div>

      {exportState.export === "success" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Export completed. Exported {exportState.exported ?? "0"} of {exportState.attempted ?? "0"} unexported leads.
        </div>
      ) : null}

      {exportState.export === "partial" ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Export partially completed. Exported {exportState.exported ?? "0"} of {exportState.attempted ?? "0"}. {exportState.message}
        </div>
      ) : null}

      {exportState.export === "failed" ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">Export failed: {exportState.message ?? "Unknown error"}</div> : null}

      {unexportedLeadCount === 0 && leads.length > 0 ? <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">No unexported confirmed leads are currently available.</div> : null}

      {sortedLeads.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <h2 className="font-semibold">No outreach-ready leads yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Confirm useful sponsor evidence from peer channels to create leads for outreach.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sortedLeads.map((lead) => {
            const updateLead = updateLeadExportFieldsAction.bind(null, campaign.id, lead.id);

            return (
              <div key={lead.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{lead.sponsorName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Peer Channel: {lead.sponsorSignal.manualPeerChannel ?? lead.channel.displayName} {lead.channel.login && !lead.channel.login.startsWith("manual-") ? `(@${lead.channel.login})` : ""}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Seen viewers: {lead.sponsorSignal.streamSnapshot?.viewerCount ?? lead.sponsorSignal.manualSeenViewers ?? "unknown"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Evidence/Proof Source: {lead.sponsorSignal.sourceTitle}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Export: {lead.exportedAt ? `Exported to ${lead.exportedTab ?? "Google Sheets"} at ${lead.exportedAt.toLocaleString()}` : "Not exported"}</p>
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
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">{lead.status}</span>
              </div>
              <form action={updateLead} className="mt-5 grid gap-3 rounded-lg border bg-muted/30 p-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Sponsor category
                  <input name="sponsorCategory" defaultValue={lead.sponsorCategory ?? ""} className="rounded-md border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Sponsorship type
                  <input name="sponsorshipType" defaultValue={lead.sponsorshipType ?? ""} placeholder="Dedicated Stream" className="rounded-md border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Sponsor contact
                  <input name="sponsorContact" defaultValue={lead.sponsorContact ?? ""} className="rounded-md border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Outreach status
                  <input name="outreachStatus" defaultValue={lead.outreachStatus} className="rounded-md border bg-background px-3 py-2 font-normal" />
                </label>
                <label className="grid gap-2 text-sm font-medium md:col-span-2">
                  Notes
                  <textarea name="notes" rows={2} defaultValue={lead.notes ?? ""} className="rounded-md border bg-background px-3 py-2 font-normal" />
                </label>
                <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium">
                  Save export fields
                </button>
              </form>
            </div>
            );
          })}
        </div>
      )}

      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Latest export logs</h2>
        {exportLogs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No exports have run yet.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {exportLogs.map((log) => (
              <div key={log.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{log.destination}</p>
                    <p className="mt-1 text-muted-foreground">
                      {log.status} · {log.rowCount} rows
                    </p>
                    {log.errorMessage ? <p className="mt-1 text-red-700">{log.errorMessage}</p> : null}
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
