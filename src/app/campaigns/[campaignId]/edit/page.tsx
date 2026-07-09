import { notFound } from "next/navigation";
import { updateCampaignAction } from "../../actions";
import { CampaignForm } from "../../campaign-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditCampaignPageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditCampaignPage({ params, searchParams }: EditCampaignPageProps) {
  const { campaignId } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { categories: { orderBy: { createdAt: "asc" } } },
  });

  if (!campaign) {
    notFound();
  }

  const updateCampaign = updateCampaignAction.bind(null, campaign.id);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Research Campaign</h1>
        <p className="mt-2 text-muted-foreground">Update peer channels, viewer range, and sponsor evidence terms.</p>
      </div>
      <div className="rounded-lg bg-card/70 p-4 ring-1 ring-border/70 sm:p-5">
        <CampaignForm action={updateCampaign} campaign={campaign} error={error} submitLabel="Save campaign" />
      </div>
    </div>
  );
}
