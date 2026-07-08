import Link from "next/link";

const demoCampaign = {
  id: "demo-roblox-micro-sponsors",
  name: "Roblox Micro Sponsors",
  range: "30-500 viewers",
  languages: "EN, PT, ES",
};

export default function CampaignsPage() {
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
      <Link href={`/campaigns/${demoCampaign.id}`} className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary">
        <h2 className="font-semibold">{demoCampaign.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {demoCampaign.range} · {demoCampaign.languages}
        </p>
      </Link>
    </div>
  );
}
