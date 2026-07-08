import { createCampaignAction } from "../actions";
import { CampaignForm } from "../campaign-form";

type NewCampaignPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewCampaignPage({ searchParams }: NewCampaignPageProps) {
  const { error } = await searchParams;

  return (
    <div className="max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight">New campaign</h1>
      <p className="mt-2 text-muted-foreground">Create a peer-channel sponsor lead research campaign for your Twitch channel.</p>
      <div className="mt-6">
        <CampaignForm action={createCampaignAction} error={error} submitLabel="Create campaign" />
      </div>
    </div>
  );
}
