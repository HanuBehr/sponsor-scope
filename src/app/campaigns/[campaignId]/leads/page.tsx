type CampaignLeadsPageProps = {
  params: Promise<{ campaignId: string }>;
};

export default async function CampaignLeadsPage({ params }: CampaignLeadsPageProps) {
  const { campaignId } = await params;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Campaign ID: {campaignId}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Confirmed leads</h1>
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">BlockBites</h2>
        <p className="mt-2 text-sm text-muted-foreground">Confirmed from a high-confidence sponsored stream title match.</p>
      </div>
    </div>
  );
}
