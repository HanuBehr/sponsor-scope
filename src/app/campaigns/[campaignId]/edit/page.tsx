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
    <div className="max-w-2xl rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="text-3xl font-semibold tracking-tight">Edit campaign</h1>
      <p className="mt-2 text-muted-foreground">Update peer-channel filters, sponsor evidence terms, and discovery categories.</p>
      <div className="mt-6">
        <CampaignForm action={updateCampaign} campaign={campaign} error={error} submitLabel="Save campaign" />
      </div>
    </div>
  );
}
