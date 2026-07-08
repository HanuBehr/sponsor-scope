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
      sponsorSignal: true,
    },
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
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirmed leads</h1>
          <p className="mt-2 text-sm text-muted-foreground">{unexportedLeadCount} unexported confirmed leads ready for Google Sheets.</p>
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

      {leads.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <h2 className="font-semibold">No confirmed leads yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Confirm sponsor signals to create leads for this campaign.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => {
            const updateLead = updateLeadExportFieldsAction.bind(null, campaign.id, lead.id);

            return (
              <div key={lead.id} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold">{lead.sponsorName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{lead.channel.displayName} · {lead.sponsorSignal.sourceTitle}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Export: {lead.exportedAt ? `Exported to ${lead.exportedTab ?? "Google Sheets"}` : "Not exported"}</p>
                  {lead.sourceUrl ? (
                    <a href={lead.sourceUrl} className="mt-2 inline-flex text-sm font-medium text-primary" target="_blank" rel="noreferrer">
                      Open source
                    </a>
                  ) : null}
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
