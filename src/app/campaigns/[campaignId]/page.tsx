import Link from "next/link";

type CampaignPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { campaignId } = await params;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Campaign ID: {campaignId}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Roblox Micro Sponsors</h1>
        <p className="mt-2 text-muted-foreground">Demo campaign shell for reviewing sponsor signals and confirmed leads.</p>
      </div>
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
