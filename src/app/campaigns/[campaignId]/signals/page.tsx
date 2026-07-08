type CampaignSignalsPageProps = {
  params: Promise<{ campaignId: string }>;
};

const signals = [
  { sponsor: "BlockBites", title: "Sponsored by BlockBites - Roblox tycoon night", confidence: "HIGH", score: 85 },
  { sponsor: "CreatorCrate", title: "Use code CREATORCRATE for new drops", confidence: "HIGH", score: 70 },
  { sponsor: "Unknown", title: "Giveaway after ranked Roblox games", confidence: "LOW", score: 20 },
];

export default async function CampaignSignalsPage({ params }: CampaignSignalsPageProps) {
  const { campaignId } = await params;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Campaign ID: {campaignId}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sponsor signals</h1>
      </div>
      <div className="grid gap-3">
        {signals.map((signal) => (
          <div key={signal.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold">{signal.sponsor}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{signal.title}</p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {signal.confidence} · {signal.score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
