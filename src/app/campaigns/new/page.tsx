import { createCampaignAction } from "../actions";
import { CampaignForm } from "../campaign-form";

type NewCampaignPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCampaignPage({ searchParams }: NewCampaignPageProps) {
  const { error } = await searchParams;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Research Campaign</h1>
        <p className="mt-2 text-muted-foreground">Configure peer channels, viewer range, and sponsor evidence terms.</p>
      </div>
      <div className="rounded-lg bg-card/70 p-4 ring-1 ring-border/70 sm:p-5">
        <CampaignForm action={createCampaignAction} error={error} submitLabel="Create campaign" />
      </div>
    </div>
  );
}
